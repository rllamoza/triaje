import { useState } from 'react'
import { TicketModal, type TicketInfo } from '../../components/common/TicketModal'
import { useFeatureStore } from '../../store/featureStore'
import { getRegiones, getProvincias, getDistritos } from '../../data/peruUbigeo'
import { saveSystemSettings } from '../../services/settingsService'
import {
  useStoreBeneficiario,
  useReniecLookup,
  useStoreAtencion,
  useAtenciones,
  useCampaigns,
  useCampaignSpecialties,
  useHistorialComunalByDni,
  useBeneficiariosBuscar,
} from '../../api/hooks'
import { useAuthStore } from '../../store/authStore'
import { PATIENT_DATABASE } from '../../services/patientRegistry'

export default function BeneficiarioPage() {
  const { registroFields, comunidades, addComunidad } = useFeatureStore()
  const [dni, setDni] = useState('')
  const [region, setRegion] = useState('Cusco')
  const [provincia, setProvincia] = useState('Urubamba')
  const [distrito, setDistrito] = useState('Urubamba')
  const [isAddingComunidad, setIsAddingComunidad] = useState(false)
  const [newComunidadName, setNewComunidadName] = useState('')

  const handleRegionChange = (newReg: string) => {
    setRegion(newReg)
    const provs = getProvincias(newReg)
    const firstProv = provs[0] || ''
    setProvincia(firstProv)
    const dists = getDistritos(newReg, firstProv)
    setDistrito(dists[0] || '')
  }

  const handleProvinciaChange = (newProv: string) => {
    setProvincia(newProv)
    const dists = getDistritos(region, newProv)
    setDistrito(dists[0] || '')
  }

  const handleSaveNewComunidad = async () => {
    const clean = newComunidadName.trim()
    if (!clean) return
    addComunidad(clean)
    setComunidad(clean)
    setIsAddingComunidad(false)
    setNewComunidadName('')
    try {
      const updated = [...useFeatureStore.getState().comunidades, clean]
      await saveSystemSettings({ comunidades: updated })
    } catch {}
  }
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [sexo, setSexo] = useState<'M' | 'F'>('M')
  const [estadoCivil, setEstadoCivil] = useState('')
  const [idioma, setIdioma] = useState('')
  const [comunidad, setComunidad] = useState('')
  const [telefono, setTelefono] = useState('')
  const [altitud, setAltitud] = useState<number | ''>('')
  const [tiempoViaje, setTiempoViaje] = useState('')
  const [seguro, setSeguro] = useState<'sis' | 'essalud' | 'ninguno' | 'privado' | ''>('')
  const [motivo, setMotivo] = useState('')

  // Antecedentes en blanco
  const [hipertension, setHipertension] = useState(false)
  const [diabetes, setDiabetes] = useState(false)
  const [asma, setAsma] = useState(false)
  const [anemia, setAnemia] = useState(false)
  const [gestante, setGestante] = useState(false)
  const [alergias, setAlergias] = useState('')

  const [patientExists, setPatientExists] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isSearchingReniec, setIsSearchingReniec] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [lastAssignedTicket, setLastAssignedTicket] = useState<string | null>(null)
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [assignedTicketInfo, setAssignedTicketInfo] = useState<TicketInfo | null>(null)
  const [assignedTickets, setAssignedTickets] = useState<TicketInfo[]>([])

  // Selección múltiple de especialidades médicas
  const [selectedSpecialtyCodes, setSelectedSpecialtyCodes] = useState<string[]>([])

  // Búsqueda interactiva por DNI o Apellidos / Nombres
  const [searchBeneficiarioQuery, setSearchBeneficiarioQuery] = useState('')
  const [isSearchBeneficiarioOpen, setIsSearchBeneficiarioOpen] = useState(false)
  const { data: searchBeneficiariosData, isLoading: isSearchingBeneficiarios } = useBeneficiariosBuscar(searchBeneficiarioQuery)

  const handleSelectBeneficiario = (p: any) => {
    setDni(p.dni || '')
    setNombres(p.nombres || '')
    setApellidos(p.apellidos || '')
    setFechaNac(p.fecha_nacimiento || '')
    setSexo((p.sexo === 'F' ? 'F' : 'M') as 'M' | 'F')
    if (p.region) {
      setRegion(p.region)
      const provs = getProvincias(p.region)
      if (p.provincia && provs.includes(p.provincia)) {
        setProvincia(p.provincia)
        const dists = getDistritos(p.region, p.provincia)
        if (p.distrito && dists.includes(p.distrito)) {
          setDistrito(p.distrito)
        }
      }
    }
    if (p.comunidad) {
      setComunidad(p.comunidad)
      if (!useFeatureStore.getState().comunidades.includes(p.comunidad)) {
        addComunidad(p.comunidad)
      }
    }
    if (p.celular || p.telefono) setTelefono(p.celular || p.telefono)
    if (p.estado_civil) setEstadoCivil(p.estado_civil)
    if (p.idioma_principal) setIdioma(p.idioma_principal)
    if (p.altitud_residencia) setAltitud(p.altitud_residencia)
    if (p.tipo_seguro) setSeguro(p.tipo_seguro)

    setPatientExists(true)
    setIsSearchBeneficiarioOpen(false)
    setSearchBeneficiarioQuery('')

    const alerts = []
    if (!p.dni) alerts.push('⚠️ Paciente sin DNI en padrón (DNI pendiente)')
    if (p.fecha_nacimiento && p.fecha_nacimiento.endsWith('-01-01')) {
      alerts.push('⚠️ Fecha estimada (1 de Enero) - favor confirmar día y mes exacto')
    }

    setMessage({
      text: `✓ Beneficiario cargado: ${p.nombres} ${p.apellidos}.${alerts.length ? ' ' + alerts.join(' | ') : ''} Seleccione la ESPECIALIDAD requerida.`,
      type: 'success',
    })
  }

  const reniecLookup = useReniecLookup()
  const createBeneficiario = useStoreBeneficiario()
  const createAtencion = useStoreAtencion()
  const { data: atencionesData } = useAtenciones()
  const atencionesList: any[] = Array.isArray(atencionesData)
    ? atencionesData
    : (Array.isArray(atencionesData?.data) ? atencionesData.data : [])

  // Campañas disponibles y control de selección por rol
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.role === 'admin'
  const { data: allCampaigns = [] } = useCampaigns()
  const activeCampaign = allCampaigns.find((c) => c.status === 'active') || allCampaigns[0]
  const [adminCampaignId, setAdminCampaignId] = useState<number | null>(null)

  // Para usuarios regulares SIEMPRE es la campaña activa; solo admin puede seleccionar otra
  const currentCampaignId = isAdmin
    ? (adminCampaignId ?? activeCampaign?.id ?? 1)
    : (activeCampaign?.id ?? 1)
  const currentCampaign = allCampaigns.find((c) => c.id === currentCampaignId) || activeCampaign

  const { data: specialtiesList = [] } = useCampaignSpecialties(currentCampaignId)

  // Consulta reactiva de Historial Comunal en BD (campañas y especialidades previas)
  const { data: historialData, isLoading: loadingHistorial } = useHistorialComunalByDni(dni)

  // Especialidades seleccionadas y cálculo de turnos proyectados
  const selectedSpecialties = specialtiesList.filter((s) =>
    selectedSpecialtyCodes.includes(s.specialty_code)
  )

  const projectedTickets = selectedSpecialties.map((s) => {
    const nextNum = (s.cupo_ocupado ?? 0) + 1
    return {
      specialty_code: s.specialty_code,
      specialty_name: s.specialty_name,
      medico_nombre: s.medico_nombre,
      consultorio: s.consultorio || 'Consultorio 01',
      cupo_disponible: s.cupo_disponible ?? (s.cupo_maximo - (s.cupo_ocupado ?? 0)),
      cupo_maximo: s.cupo_maximo,
      ticketCode: `${s.specialty_code}-${String(nextNum).padStart(4, '0')}`,
    }
  })

  const toggleSpecialty = (code: string) => {
    setSelectedSpecialtyCodes((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code)
      } else {
        return [...prev, code]
      }
    })
  }

  const handleReniec = async (customDni?: string) => {
    const targetDni = (customDni || dni).trim()
    if (targetDni.length !== 8 || !/^\d{8}$/.test(targetDni)) {
      setMessage({ text: 'Por favor ingrese un número de DNI válido de 8 dígitos.', type: 'error' })
      return
    }
    setIsSearchingReniec(true)
    setMessage(null)
    try {
      const res = await reniecLookup.mutateAsync(targetDni)
      const p = res.data || res

      const nom = p.nombres || ''
      const ape = p.apellidos || `${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.trim()
      const dob = p.fecha_nacimiento || ''
      const sex = (p.sexo === 'F' ? 'F' : 'M') as 'M' | 'F'

      setNombres(nom)
      setApellidos(ape)
      if (dob) setFechaNac(dob)
      setSexo(sex)
      if (p.region) {
        setRegion(p.region)
        const provs = getProvincias(p.region)
        if (p.provincia && provs.includes(p.provincia)) {
          setProvincia(p.provincia)
          const dists = getDistritos(p.region, p.provincia)
          if (p.distrito && dists.includes(p.distrito)) {
            setDistrito(p.distrito)
          }
        }
      }
      if (p.comunidad) {
        setComunidad(p.comunidad)
        if (!useFeatureStore.getState().comunidades.includes(p.comunidad)) {
          addComunidad(p.comunidad)
        }
      }
      if (p.celular || p.telefono) setTelefono(p.celular || p.telefono)
      if (p.estado_civil) setEstadoCivil(p.estado_civil)
      if (p.idioma_principal) setIdioma(p.idioma_principal)
      if (p.altitud_residencia) setAltitud(p.altitud_residencia)
      if (p.tipo_seguro) setSeguro(p.tipo_seguro)
      if (p.alergias) setAlergias(p.alergias)
      if (p.antecedentes) {
        const ante = String(p.antecedentes).toLowerCase()
        setHipertension(ante.includes('hipertens'))
        setDiabetes(ante.includes('diabet'))
        setAsma(ante.includes('asma') || ante.includes('epoc'))
        setAnemia(ante.includes('anemia'))
        setGestante(ante.includes('gestant') || ante.includes('embaraz'))
      }

      const isLocal = Boolean(res.from_cache || res.source === 'Padrón Comunitario' || res.source === 'Padrón Local Campaña' || p.id)
      setPatientExists(isLocal)

      if (isLocal) {
        const histResumen = res.historial_campanas && res.historial_campanas.length > 0
          ? ` Historial previo en base de datos: ${res.historial_campanas.map((c: any) => `${c.campaign_name} (${c.especialidades.join(', ')})`).join(' | ')}.`
          : ' Sin atenciones previas en campañas.'
        setMessage({
          text: `✓ Paciente preexistente en padrón: ${nom} ${ape}.${histResumen} Por favor seleccione la ESPECIALIDAD requerida para esta jornada.`,
          type: 'success',
        })
      } else {
        setMessage({
          text: `✓ Identidad verificada en RENIEC: ${nom} ${ape}. Por favor complete comunidad, teléfono y seleccione la ESPECIALIDAD médica que necesita.`,
          type: 'success',
        })
      }
    } catch {
      // Local fallback si el backend no responde o no tiene conexión
      const localMatch = PATIENT_DATABASE.find((pt) => pt.dni === targetDni)
      if (localMatch) {
        const parts = localMatch.paciente.split(',')
        const ape = parts[0]?.trim() || localMatch.paciente
        const nom = parts[1]?.trim() || ''
        setNombres(nom)
        setApellidos(ape)
        setSexo(localMatch.sexo)
        if (localMatch.telefono) setTelefono(localMatch.telefono)
        setPatientExists(true)
        setMessage({
          text: `✓ Datos cargados desde Padrón Comunitario Local (${localMatch.paciente}). Por favor seleccione la ESPECIALIDAD médica que necesita.`,
          type: 'success',
        })
      } else {
        setPatientExists(false)
        setMessage({
          text: 'DNI no encontrado en el padrón ni en RENIEC. Ingrese los datos del paciente manualmente y seleccione la ESPECIALIDAD requerida.',
          type: 'error',
        })
      }
    } finally {
      setIsSearchingReniec(false)
    }
  }

  const calculateAge = (dob: string) => {
    if (!dob) return 0
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  const handleSubmit = async () => {
    setMessage(null)
    const cleanDni = dni.trim()
    // Solo si el usuario ingresó DNI se valida su formato numérico
    if (cleanDni && !/^\d{8,15}$/.test(cleanDni)) {
      setMessage({ text: 'El DNI debe contener entre 8 y 15 dígitos numéricos si se especifica.', type: 'error' })
      return
    }
    if (!nombres.trim() || !apellidos.trim()) {
      setMessage({ text: 'Debe ingresar nombres y apellidos completos del beneficiario.', type: 'error' })
      return
    }

    if (selectedSpecialtyCodes.length === 0) {
      setMessage({
        text: '⚠️ Por favor seleccione al menos una Especialidad Médica para poder crear los turnos de atención.',
        type: 'error',
      })
      return
    }

    for (const sp of selectedSpecialties) {
      const disp = sp.cupo_disponible ?? (sp.cupo_maximo - (sp.cupo_ocupado ?? 0))
      if (disp <= 0) {
        setMessage({
          text: `No hay cupos disponibles para la especialidad ${sp.specialty_name}. Por favor desmárquela o elija otra disponible.`,
          type: 'error',
        })
        return
      }
    }

    setSubmitting(true)
    try {
      // 1. Guardar todos los campos del paciente que aparecen en pantalla
      const b = await createBeneficiario.mutateAsync({
        dni: cleanDni || undefined,
        nombres: nombres.trim().toUpperCase(),
        apellidos: apellidos.trim().toUpperCase(),
        fecha_nacimiento: (registroFields.fechaNacimiento !== false && fechaNac) ? fechaNac : undefined,
        sexo: (registroFields.sexo !== false && sexo) ? sexo : 'O',
        estado_civil: registroFields.estadoCivil ? (estadoCivil || undefined) : undefined,
        idioma_principal: registroFields.lenguaMaterna ? (idioma || undefined) : undefined,
        region: (registroFields.seccionResidencia && registroFields.ubigeo !== false) ? (region || undefined) : undefined,
        provincia: (registroFields.seccionResidencia && registroFields.ubigeo !== false) ? (provincia || undefined) : undefined,
        distrito: (registroFields.seccionResidencia && registroFields.ubigeo !== false) ? (distrito || undefined) : undefined,
        comunidad: (registroFields.seccionResidencia && registroFields.comunidad) ? (comunidad || undefined) : undefined,
        celular: (registroFields.seccionResidencia && registroFields.telefono) ? (telefono || undefined) : undefined,
        telefono: (registroFields.seccionResidencia && registroFields.telefono) ? (telefono || undefined) : undefined,
        altitud_residencia: (registroFields.seccionResidencia && registroFields.altitud) ? (altitud || undefined) : undefined,
        tipo_seguro: (registroFields.seccionResidencia && registroFields.seguro) ? (seguro || 'ninguno') : 'ninguno',
        alergias: (registroFields.seccionAntecedentes && registroFields.alergias) ? (alergias || undefined) : undefined,
        antecedentes: registroFields.seccionAntecedentes ? [
          (registroFields.hipertension && hipertension) ? 'Hipertensión' : '',
          (registroFields.diabetes && diabetes) ? 'Diabetes' : '',
          (registroFields.asma && asma) ? 'Asma/EPOC' : '',
          (registroFields.anemia && anemia) ? 'Anemia' : '',
          (registroFields.gestante && gestante) ? 'Gestante' : '',
        ].filter(Boolean).join(', ') || undefined : undefined,
      })

      // 2. Extraer identificador único garantizado del beneficiario
      const benefId = Number(b?.id || (b as any)?.data?.id || (b as any)?.beneficiario?.id)
      if (!benefId) {
        throw new Error('No se pudo obtener el identificador del paciente guardado.')
      }

      // 3. Asignar nuevo(s) número(s) de atención por cada especialidad seleccionada
      const atencionRes = await createAtencion.mutateAsync({
        beneficiario_id: benefId,
        campaign_id: currentCampaignId,
        seguro_usado: seguro || 'ninguno',
        notes: `Motivo: ${motivo || 'Control general'} | Traslado: ${tiempoViaje || '0'} min | Alergias: ${alergias || 'Ninguna'}`,
        specialty_codes: selectedSpecialtyCodes,
        specialty_code: selectedSpecialtyCodes[0],
      })

      const rawList = atencionRes?.atenciones || (Array.isArray(atencionRes) ? atencionRes : [atencionRes])
      const now = new Date()
      const nowHora = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const nowFecha = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const patientAge = fechaNac ? calculateAge(fechaNac) : undefined

      const generatedTickets: TicketInfo[] = rawList.map((atn: any) => {
        const corr = atn.ticket_number || (atn.ticket_codigo ? atn.ticket_codigo.match(/(\d+)$/)?.[1] : undefined)
        return {
          ticket: String(corr || atn.ticket_codigo || '1'),
          correlativo: corr || atn.ticket_number,
          paciente: `${apellidos.trim().toUpperCase()}, ${nombres.trim().toUpperCase()}`,
          dni: cleanDni || 'S/DNI',
          edad: patientAge ? `${patientAge} años` : (atn.edad_calculada ? `${atn.edad_calculada} años` : undefined),
          comunidad: comunidad || 'Comunidad General',
          distrito: (distrito && distrito !== 'Otro') ? distrito : (atn.distrito || comunidad || 'Urubamba'),
          fecha: atn.arrival_time ? new Date(atn.arrival_time).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : nowFecha,
          hora: atn.arrival_time ? new Date(atn.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : nowHora,
          especialidad: atn.specialty_name || 'Medicina General',
          consultorio: atn.consultorio || 'Consultorio 01',
        }
      })

      setAssignedTickets(generatedTickets)
      setAssignedTicketInfo(generatedTickets[0] || null)
      const formatNum = (val?: string | number) => {
        const n = parseInt(String(val || ''), 10)
        return isNaN(n) ? String(val || '0001') : String(n).padStart(4, '0')
      }
      const ticketsStr = generatedTickets.map((t) => formatNum(t.correlativo || t.ticket)).join(', ')
      setLastAssignedTicket(ticketsStr)
      setTicketModalOpen(true)

      setMessage({
        text: `✓ ¡Paciente registrado con éxito! Turno Asignado: ${generatedTickets.map((t) => `${formatNum(t.correlativo || t.ticket)} (${t.especialidad})`).join(' y ')} para ${apellidos.trim().toUpperCase()}, ${nombres.trim().toUpperCase()}.`,
        type: 'success',
      })

      // Limpiar formulario completo en blanco para el próximo registro
      setDni('')
      setNombres('')
      setApellidos('')
      setFechaNac('')
      setSexo('M')
      setEstadoCivil('')
      setIdioma('')
      setRegion('Cusco')
      setProvincia('Urubamba')
      setDistrito('Urubamba')
      setComunidad('')
      setTelefono('')
      setAltitud('')
      setTiempoViaje('')
      setSeguro('')
      setMotivo('')
      setAlergias('')
      setHipertension(false)
      setDiabetes(false)
      setAsma(false)
      setAnemia(false)
      setGestante(false)
      setSelectedSpecialtyCodes([])
      setPatientExists(false)
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message
      setMessage({ text: `Error al registrar beneficiario: ${apiMsg || 'Verifique los datos.'}`, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Header Contextual Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-primary-container text-on-primary-fixed">
              ADM-01
            </span>

            {/* Nombre de la Campaña Actual sobre el título */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-primary/40 rounded-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-bold text-on-surface uppercase">Campaña:</span>
                <select
                  value={currentCampaignId}
                  onChange={(e) => setAdminCampaignId(Number(e.target.value))}
                  className="bg-surface text-xs font-bold text-primary border border-surface-container-highest px-2 py-0.5 focus:outline-none focus:border-primary cursor-pointer"
                  title="Cambiar campaña de destino (Solo administradores)"
                >
                  {allCampaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.status === 'active' ? '(Activa)' : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[9px] font-mono font-bold bg-primary text-on-primary px-1 rounded-xs uppercase">
                  Admin
                </span>
              </div>
            ) : (
              <span className="px-2.5 py-1 text-xs font-bold bg-surface-container text-on-surface flex items-center gap-2 border border-surface-container-high select-none">
                <span className="w-2 h-2 rounded-full bg-tertiary" />
                <span>
                  Campaña Activa:{' '}
                  <strong className="text-primary font-black uppercase">
                    {activeCampaign?.name || currentCampaign?.name || 'Campaña Activa'}
                  </strong>
                </span>
                {(activeCampaign?.location_name || currentCampaign?.location_name) && (
                  <span className="text-[11px] text-on-surface-variant font-normal">
                    • {activeCampaign?.location_name || currentCampaign?.location_name}
                  </span>
                )}
              </span>
            )}
          </div>
          <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-on-surface">
            Registro de Beneficiario{' '}
            <span className="font-semibold text-primary">&amp; Afiliación de Campaña</span>
          </h1>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-surface px-4 py-2 shadow-xs border border-surface-container-high">
            <div className="mr-3 p-2 bg-primary-container text-on-primary-fixed">
              <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant">
                Registrados Hoy
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-on-surface">142</span>
                <span className="text-[10px] text-tertiary font-medium">↑ +18 última hora</span>
              </div>
            </div>
          </div>

          <div className="flex items-center bg-surface px-4 py-2 shadow-xs border border-surface-container-high">
            <div className="mr-3 p-2 bg-surface-container text-on-surface">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant">
                Tiempo Prom. Mesa
              </div>
              <div className="text-xl font-bold text-on-surface">
                02:14 <span className="text-[10px] font-normal text-on-surface-variant">min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div className="flex items-start bg-surface p-3 border border-surface-container-high shadow-xs">
          <div className="mr-3 text-tertiary">
            <span className="material-symbols-outlined text-[20px]">usb</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-on-surface">Periférico Biométrico RENIEC Conectado</div>
              <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-tertiary-container text-on-tertiary-container font-mono">
                Online USB-02
              </span>
            </div>
            <div className="text-xs text-on-surface-variant mt-0.5">
              Lector DNIe listo para captura de huella dactilar y validación de afiliación.
            </div>
          </div>
        </div>

        {/* Card 2: Control de Historial Comunal */}
        <div
          className={`flex items-start p-3 border shadow-xs transition-all ${
            dni.trim().length === 8 && historialData?.has_history
              ? 'bg-[#fff8e1] border-[#ffe082]'
              : dni.trim().length === 8 && historialData && !historialData.has_history
              ? 'bg-surface-container-low border-surface-container-high'
              : 'bg-[#fff8e1] border-[#ffe082]'
          }`}
        >
          <div
            className={`mr-3 ${
              dni.trim().length === 8 && historialData?.has_history
                ? 'text-[#b78103]'
                : dni.trim().length === 8 && historialData && !historialData.has_history
                ? 'text-on-surface-variant'
                : 'text-[#b78103]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {dni.trim().length === 8 && historialData?.has_history
                ? 'notification_important'
                : dni.trim().length === 8 && historialData && !historialData.has_history
                ? 'history_toggle_off'
                : 'notification_important'}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div
                className={`text-xs font-semibold ${
                  dni.trim().length === 8 && historialData?.has_history
                    ? 'text-[#5c4100]'
                    : dni.trim().length === 8 && historialData && !historialData.has_history
                    ? 'text-on-surface'
                    : 'text-[#5c4100]'
                }`}
              >
                Control de Historial Comunal
              </div>

              {loadingHistorial ? (
                <span className="text-[10px] font-mono text-primary font-bold animate-pulse flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                  Buscando en BD...
                </span>
              ) : dni.trim().length === 8 && historialData ? (
                historialData.has_history ? (
                  <span className="text-[10px] font-mono text-[#5c4100] font-bold bg-[#ffe082] px-1.5 py-0.5">
                    {historialData.campanas[0]?.campaign_code || 'EXP-PREVIO'}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-on-surface-variant font-bold bg-surface-container-highest px-1.5 py-0.5">
                    SIN ATENCIONES PREVIAS
                  </span>
                )
              ) : (
                <span className="text-[10px] font-mono text-[#5c4100] font-bold">
                  EXP-HISTORIAL
                </span>
              )}
            </div>

            {loadingHistorial ? (
              <div className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                <span>Buscando campañas y especialidades en la base de datos...</span>
              </div>
            ) : dni.trim().length === 8 && historialData ? (
              historialData.has_history && historialData.campanas.length > 0 ? (
                <div className="mt-1 space-y-1">
                  <div className="text-[11px] font-bold text-[#856404] uppercase">
                    Atenciones registradas en esta base de datos:
                  </div>
                  {historialData.campanas.map((c) => (
                    <div
                      key={c.campaign_name}
                      className="text-xs text-[#5c4100] bg-[#fff3cd] border border-[#ffeeba] p-1.5 rounded-xs"
                    >
                      <div className="font-bold flex items-center gap-1 text-primary">
                        <span className="material-symbols-outlined text-xs">campaign</span>
                        <span>Campaña: {c.campaign_name}</span>
                        {c.fecha_ultima && (
                          <span className="text-[10px] text-on-surface-variant font-mono">
                            ({c.fecha_ultima})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#533f03] mt-0.5 pl-4">
                        <span className="font-semibold text-secondary">Especialidades:</span>{' '}
                        <strong className="text-on-surface">{c.especialidades.join(', ')}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-on-surface-variant mt-0.5 font-medium">
                  <strong className="text-on-surface">Sin atenciones previas.</strong> El paciente no registra atenciones médicas en ninguna campaña en esta base de datos.
                </div>
              )
            ) : (
              <div className="text-xs text-[#5c4100] mt-0.5">
                Al ingresar el DNI el sistema busca en la base de datos qué campañas y especialidades se atendió el paciente o si no tiene atenciones previas.
              </div>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 mb-6 text-xs flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-tertiary-container text-on-tertiary-container border-tertiary/30'
              : 'bg-error-container text-on-error-container border-error/30'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Primary Workspace Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Forms */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* SECTION 1: Identificación y Datos Personales */}
          <section className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-on-primary text-xs font-semibold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-sm font-semibold tracking-tight text-on-surface uppercase">
                  Identificación y Datos Personales
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant font-mono">* Solo DNI, Nombres y Apellidos son obligatorios</span>
            </div>

            <div className="space-y-4">
              {/* BÚSQUEDA PREDICTIVA POR DNI O APELLIDOS */}
              <div className="relative bg-surface-container-low p-3.5 border-2 border-primary/30 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">person_search</span>
                    <span>Búsqueda Rápida de Beneficiario (Por DNI o Apellidos / Nombres)</span>
                  </label>
                  <span className="text-[11px] text-on-surface-variant font-mono">
                    Escriba para autocompletar desde el padrón
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full h-11 px-3.5 pl-10 bg-surface text-on-surface text-sm border border-surface-container-high focus:border-primary focus:outline-none placeholder:text-on-surface-variant/50 placeholder:italic font-medium shadow-xs"
                    placeholder="Buscar por DNI o Apellidos (ej. 47361781 o NEYRA OSCCO o CAROLA)..."
                    value={searchBeneficiarioQuery}
                    onChange={(e) => {
                      setSearchBeneficiarioQuery(e.target.value)
                      setIsSearchBeneficiarioOpen(true)
                    }}
                    onFocus={() => {
                      if (searchBeneficiarioQuery.trim().length >= 2) setIsSearchBeneficiarioOpen(true)
                    }}
                  />
                  <span className="material-symbols-outlined absolute left-3 top-3 text-primary text-[18px]">
                    search
                  </span>
                  {isSearchingBeneficiarios && (
                    <span className="material-symbols-outlined absolute right-3 top-3 text-primary text-[18px] animate-spin">
                      sync
                    </span>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {isSearchBeneficiarioOpen && searchBeneficiarioQuery.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-surface border-2 border-primary shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-surface-container">
                    {searchBeneficiariosData?.data && searchBeneficiariosData.data.length > 0 ? (
                      searchBeneficiariosData.data.map((b) => {
                        const hasNoDni = !b.dni || b.dni.trim() === ''
                        const isJan1st = Boolean(b.fecha_nacimiento && b.fecha_nacimiento.endsWith('-01-01'))
                        return (
                          <div
                            key={b.id}
                            onClick={() => handleSelectBeneficiario(b)}
                            className="p-3 hover:bg-primary/5 cursor-pointer transition-colors flex items-center justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-on-surface">
                                  {b.apellidos}, {b.nombres}
                                </span>
                                {hasNoDni ? (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-error-container text-error rounded border border-error/50">
                                    ⚠️ Sin DNI (Pendiente)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-surface-container-high text-on-surface rounded font-mono">
                                    DNI: {b.dni}
                                  </span>
                                )}
                                {isJan1st && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-error-container text-error rounded border border-error/50">
                                    ⚠️ F. Estimada (1 de Ene)
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-on-surface-variant flex items-center gap-3 mt-1 flex-wrap">
                                {b.fecha_nacimiento && (
                                  <span>
                                    F. Nac: <strong className={isJan1st ? 'text-error font-bold' : ''}>{b.fecha_nacimiento}</strong> ({b.edad_calculada ?? calculateAge(b.fecha_nacimiento)} años)
                                  </span>
                                )}
                                {b.comunidad && <span>Comunidad: <strong>{b.comunidad}</strong></span>}
                                {b.direccion_libre && <span>Dir: {b.direccion_libre}</span>}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="px-3 py-1.5 bg-primary text-on-primary text-xs font-bold uppercase rounded-none hover:bg-on-primary-fixed-variant whitespace-nowrap"
                            >
                              Seleccionar
                            </button>
                          </div>
                        )
                      })
                    ) : !isSearchingBeneficiarios ? (
                      <div className="p-4 text-center text-xs text-on-surface-variant">
                        No se encontraron personas con "{searchBeneficiarioQuery}". Ingrese los datos en el formulario para registrarlo.
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* DNI with RENIEC API Lookup & RED Alert if missing */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-7">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Documento Nacional de Identidad (DNI)
                    </label>
                    {(!dni.trim() && patientExists) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-error-container text-error rounded border border-error/50 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">warning</span>
                        DNI pendiente de registrar
                      </span>
                    )}
                  </div>
                  <div
                    className={`relative flex border transition-colors ${
                      !dni.trim() && patientExists
                        ? 'border-error bg-error-container/20 text-error focus-within:border-error'
                        : 'border-surface-container-high bg-surface-container-low focus-within:border-primary focus-within:bg-surface'
                    }`}
                  >
                    <input
                      className={`w-full h-10 px-3 bg-transparent text-sm font-mono focus:outline-none placeholder:italic ${
                        !dni.trim() && patientExists
                          ? 'text-error font-bold placeholder:text-error/60'
                          : 'text-on-surface placeholder:text-on-surface-variant/40'
                      }`}
                      maxLength={15}
                      placeholder={!dni.trim() && patientExists ? "⚠️ Sin DNI (Pendiente de registrar)" : "Ingrese DNI o deje vacío si no cuenta"}
                      type="text"
                      value={dni}
                      onChange={(e) => {
                        const val = e.target.value.trim()
                        setDni(val)
                        if (val.length === 8 && /^\d{8}$/.test(val)) {
                          handleReniec(val)
                        } else if (val.length < 8 && patientExists && !searchBeneficiarioQuery) {
                          // Mantener estado
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (dni.trim()) handleReniec()
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={isSearchingReniec || !dni.trim()}
                      onClick={() => handleReniec()}
                      className="h-10 px-4 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer rounded-none disabled:opacity-50"
                      title="Buscar datos del paciente por DNI (Enter o clic)"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${isSearchingReniec ? 'animate-spin' : ''}`}>
                        {isSearchingReniec ? 'sync' : 'fingerprint'}
                      </span>
                      <span>{isSearchingReniec ? 'Buscando...' : 'Buscar DNI'}</span>
                    </button>
                  </div>
                </div>

                <div className="md:col-span-5 flex items-center gap-2 pb-2 text-xs">
                  {patientExists ? (
                    <div className={`flex items-center gap-1.5 font-bold px-2.5 py-1 border ${
                      !dni.trim()
                        ? 'bg-error-container/30 text-error border-error/40'
                        : 'text-tertiary bg-tertiary-container/30 border-tertiary/30'
                    }`}>
                      <span className="material-symbols-outlined text-[18px]">
                        {!dni.trim() ? 'error' : 'verified'}
                      </span>
                      <span>
                        {!dni.trim() ? 'Beneficiario en Padrón (Sin DNI)' : 'Beneficiario en Padrón (Autollenado)'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                      <span className="material-symbols-outlined text-[18px] text-tertiary">check_circle</span>
                      <span>Autollenado automático al digitar 8 dígitos</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Apellidos Completos *
                  </label>
                  <input
                    className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm border border-surface-container-high focus:border-primary focus:bg-surface focus:outline-none uppercase placeholder:text-on-surface-variant/40 placeholder:italic placeholder:normal-case"
                    type="text"
                    placeholder="Ej. QUISPE HUAMÁN"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Nombres *
                  </label>
                  <input
                    className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm border border-surface-container-high focus:border-primary focus:bg-surface focus:outline-none uppercase placeholder:text-on-surface-variant/40 placeholder:italic placeholder:normal-case"
                    type="text"
                    placeholder="Ej. SANTOS FAUSTINO"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                  />
                </div>
              </div>

              {/* Fecha de Nacimiento, Edad, Sexo, Estado Civil, Idioma */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {registroFields.fechaNacimiento !== false && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                          F. Nacimiento
                        </label>
                        {fechaNac && fechaNac.endsWith('-01-01') && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-error-container text-error rounded border border-error/50">
                            ⚠️ 1 Ene (Estimada)
                          </span>
                        )}
                      </div>
                      <input
                        className={`w-full h-10 px-2 text-xs border focus:outline-none transition-colors ${
                          fechaNac && fechaNac.endsWith('-01-01')
                            ? 'border-error bg-error-container/20 text-error font-bold focus:border-error'
                            : 'border-surface-container-high bg-surface-container-low text-on-surface focus:border-primary'
                        }`}
                        type="date"
                        value={fechaNac}
                        onChange={(e) => setFechaNac(e.target.value)}
                      />
                      {fechaNac && fechaNac.endsWith('-01-01') && (
                        <span className="text-[10px] text-error font-semibold mt-1 block leading-tight">
                          * Fecha estimada (1 de Enero) - Ingrese día y mes
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                        Edad Calc.
                      </label>
                      <div className="h-10 px-3 bg-surface-container flex items-center justify-between text-sm font-semibold text-on-surface border border-surface-container-high">
                        <span>{calculateAge(fechaNac)}</span>
                        <span className="text-[11px] font-normal text-on-surface-variant">años</span>
                      </div>
                    </div>
                  </>
                )}

                {registroFields.sexo !== false && (
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Sexo Biológico
                    </label>
                    <select
                      className="w-full h-10 px-2 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                      value={sexo}
                      onChange={(e) => setSexo(e.target.value as 'M' | 'F')}
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                )}

                {registroFields.estadoCivil && (
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Estado Civil
                    </label>
                    <select
                      className="w-full h-10 px-2 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                      value={estadoCivil}
                      onChange={(e) => setEstadoCivil(e.target.value)}
                    >
                      <option value="conviviente">Conviviente</option>
                      <option value="casado">Casado(a)</option>
                      <option value="soltero">Soltero(a)</option>
                      <option value="viudo">Viudo(a)</option>
                    </select>
                  </div>
                )}

                {registroFields.lenguaMaterna && (
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Lengua Materna
                    </label>
                    <select
                      className="w-full h-10 px-2 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                      value={idioma}
                      onChange={(e) => setIdioma(e.target.value)}
                    >
                      <option value="quechua">Quechua Collao</option>
                      <option value="castellano">Castellano</option>
                      <option value="aimara">Aimara</option>
                      <option value="bilingue">Bilingüe</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SECTION 2: Residencia y Contacto */}
          {registroFields.seccionResidencia && (
            <section className="bg-surface p-6 shadow-xs border border-surface-container-high">
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-surface-container-high">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-on-primary text-xs font-semibold flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-sm font-semibold tracking-tight text-on-surface uppercase">
                    Datos de Residencia y Contacto Comunitario
                  </h2>
                </div>
                <span className="text-xs text-on-surface-variant">Acceso geográfico y cobertura</span>
              </div>

              <div className="space-y-4">
                {/* Fila 1: Ubigeo Territorial Minimalista (Región, Provincia, Distrito) y Comunidad */}
                {(registroFields.ubigeo !== false || registroFields.comunidad) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {registroFields.ubigeo !== false && (
                      <>
                        <div>
                          <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                            Región / Depto.
                          </label>
                          <select
                            className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                            value={region}
                            onChange={(e) => handleRegionChange(e.target.value)}
                          >
                            {getRegiones().map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                            Provincia
                          </label>
                          <select
                            className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                            value={provincia}
                            onChange={(e) => handleProvinciaChange(e.target.value)}
                          >
                            {getProvincias(region).map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                            Distrito
                          </label>
                          <select
                            className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                            value={distrito}
                            onChange={(e) => setDistrito(e.target.value)}
                          >
                            {getDistritos(region, provincia).map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {registroFields.comunidad && (
                      <div className={registroFields.ubigeo === false ? 'sm:col-span-2 md:col-span-4' : ''}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                            Comunidad / Sector
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsAddingComunidad(true)}
                            className="w-5 h-5 flex items-center justify-center text-primary hover:text-on-primary hover:bg-primary border border-primary/40 transition-colors cursor-pointer"
                            title="Agregar nueva comunidad"
                            aria-label="Agregar comunidad"
                          >
                            <span className="material-symbols-outlined text-[15px]">add</span>
                          </button>
                        </div>
                        <select
                          className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                          value={comunidad}
                          onChange={(e) => setComunidad(e.target.value)}
                        >
                          <option value="">-- Seleccionar Comunidad --</option>
                          {comunidades.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}



                {/* Fila 2: Móvil, Altitud, Tiempo de Traslado y Afiliación a Seguro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {registroFields.telefono && (
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                        Móvil / WhatsApp de Contacto
                      </label>
                      <div className="flex border border-surface-container-high bg-surface-container-low focus-within:border-primary">
                        <span className="h-10 px-2.5 bg-surface-container text-xs text-on-surface-variant flex items-center font-mono">
                          +51
                        </span>
                        <input
                          className="w-full h-10 px-2.5 bg-transparent text-on-surface text-xs placeholder:text-on-surface-variant/40 placeholder:italic focus:outline-none"
                          type="tel"
                          placeholder="Ej. 984 312 809"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {registroFields.altitud && (
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                        Altitud Habitual (msnm)
                      </label>
                      <div className="relative border border-surface-container-high bg-surface-container-low">
                        <input
                          className="w-full h-10 px-2.5 bg-transparent text-on-surface text-xs focus:outline-none"
                          type="number"
                          placeholder="2870"
                          value={altitud}
                          onChange={(e) => setAltitud(Number(e.target.value))}
                        />
                        <span className="absolute right-2.5 top-2.5 text-[11px] text-on-surface-variant">msnm</span>
                      </div>
                    </div>
                  )}

                  {registroFields.tiempoViaje && (
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                        Tiempo de Traslado a pie
                      </label>
                      <select
                        className="w-full h-10 px-2 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                        value={tiempoViaje}
                        onChange={(e) => setTiempoViaje(e.target.value)}
                      >
                        <option value="30">Menos de 30 min</option>
                        <option value="60">30 min a 1 hora</option>
                        <option value="120">1 a 2 horas a pie</option>
                        <option value="180">Más de 2 horas a pie</option>
                      </select>
                    </div>
                  )}

                  {registroFields.seguro && (
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                        Afiliación a Seguro Médico
                      </label>
                      <select
                        className="w-full h-10 px-2 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                        value={seguro}
                        onChange={(e) => setSeguro(e.target.value as 'sis' | 'essalud' | 'ninguno' | 'privado')}
                      >
                        <option value="sis">SIS Gratuito Subsidiado</option>
                        <option value="essalud">EsSalud (Seguro Social)</option>
                        <option value="ninguno">Sin Seguro / No Afiliado</option>
                        <option value="privado">Seguro Privado / FFAA</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* SECTION 3: Antecedentes & Factores de Riesgo */}
          {registroFields.seccionAntecedentes && (
            <section className="bg-surface p-6 shadow-xs border border-surface-container-high">
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-surface-container-high">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-on-primary text-xs font-semibold flex items-center justify-center">
                    {registroFields.seccionResidencia ? '3' : '2'}
                  </span>
                  <h2 className="text-sm font-semibold tracking-tight text-on-surface uppercase">
                    Antecedentes &amp; Factores de Riesgo Crónico
                  </h2>
                </div>
                <span className="text-xs text-on-surface-variant font-medium">Marcaje rápido de tamizaje</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {registroFields.hipertension && (
                  <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                    <input
                      type="checkbox"
                      checked={hipertension}
                      onChange={(e) => setHipertension(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-primary rounded-none"
                    />
                    <div>
                      <div className="text-xs font-semibold text-on-surface">Hipertensión Arterial</div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">Control de presión en Triaje</div>
                    </div>
                  </label>
                )}

                {registroFields.diabetes && (
                  <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                    <input
                      type="checkbox"
                      checked={diabetes}
                      onChange={(e) => setDiabetes(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-primary rounded-none"
                    />
                    <div>
                      <div className="text-xs font-semibold text-on-surface">Diabetes Mellitus</div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">Glucemia capilar recomendada</div>
                    </div>
                  </label>
                )}

                {registroFields.asma && (
                  <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                    <input
                      type="checkbox"
                      checked={asma}
                      onChange={(e) => setAsma(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-primary rounded-none"
                    />
                    <div>
                      <div className="text-xs font-semibold text-on-surface">Asma / EPOC / Silicosis</div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">Exposición a humo / minas</div>
                    </div>
                  </label>
                )}

                {registroFields.anemia && (
                  <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                    <input
                      type="checkbox"
                      checked={anemia}
                      onChange={(e) => setAnemia(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-primary rounded-none"
                    />
                    <div>
                      <div className="text-xs font-semibold text-on-surface">Desnutrición / Anemia</div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">Dosaje de Hemoglobina rápida</div>
                    </div>
                  </label>
                )}

                {registroFields.gestante && (
                  <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                    <input
                      type="checkbox"
                      checked={gestante}
                      onChange={(e) => setGestante(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-primary rounded-none"
                    />
                    <div>
                      <div className="text-xs font-semibold text-on-surface">Embarazo / Gestante</div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">Prioridad Obstétrica</div>
                    </div>
                  </label>
                )}

                {registroFields.alergias && (
                  <label className="flex items-start gap-3 bg-error-container p-3 border border-error/30 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="mt-0.5 h-4 w-4 accent-error rounded-none"
                    />
                    <div>
                      <div className="text-xs font-bold text-error flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">warning</span>
                        Alergias Medicamentosas
                      </div>
                      <div className="text-[11px] text-on-error-container font-medium mt-0.5">
                        Penicilina / Betalactámicos
                      </div>
                    </div>
                  </label>
                )}
              </div>

              {registroFields.alergias && (
                <div className="mt-4 pt-3 border-t border-surface-container-high">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Detalle de Alergias o Reacciones Adversas conocidas:
                  </label>
                  <input
                    className="w-full h-9 px-3 bg-surface-container-low text-xs text-error font-medium border border-error/50 focus:outline-none placeholder:text-error/40 placeholder:italic"
                    type="text"
                    placeholder="Ej. Alérgico a Penicilina, Sulfas, AINEs..."
                    value={alergias}
                    onChange={(e) => setAlergias(e.target.value)}
                  />
                </div>
              )}
            </section>
          )}

          {/* SECTION 4: Selección de Especialidades Médicas (Permite múltiple) */}
          <section className="bg-surface p-6 shadow-xs border border-surface-container-high space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-container-high gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-on-primary text-xs font-semibold flex items-center justify-center">
                  {1 + (registroFields.seccionResidencia ? 1 : 0) + (registroFields.seccionAntecedentes ? 1 : 0) + 1}
                </span>
                <h2 className="text-sm font-semibold tracking-tight text-on-surface uppercase">
                  ¿A qué Especialidades Médicas desea asistir? *
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant font-medium">
                  {selectedSpecialtyCodes.length > 0 ? (
                    <span className="font-bold text-primary font-mono">
                      {selectedSpecialtyCodes.length} especialidad(es) elegida(s)
                    </span>
                  ) : (
                    'Puede seleccionar más de una'
                  )}
                </span>
                {selectedSpecialtyCodes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSpecialtyCodes([])}
                    className="text-[11px] text-error hover:underline font-semibold cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {selectedSpecialtyCodes.length === 0 ? (
              <div className="p-3 bg-primary-container/40 text-on-primary-container text-xs flex items-center gap-2 border border-primary/30">
                <span className="material-symbols-outlined text-[18px] text-primary">priority_high</span>
                <span className="font-semibold">
                  Seleccione una o más especialidades médicas. Se generará un ticket y número de turno por cada una.
                </span>
              </div>
            ) : (
              <div className="p-2.5 bg-secondary-container/40 text-on-secondary-container text-xs flex flex-wrap items-center gap-2 border border-secondary/30">
                <span className="font-bold">Especialidades seleccionadas:</span>
                {selectedSpecialties.map((sp, idx) => {
                  const proj = projectedTickets.find((pt) => pt.specialty_code === sp.specialty_code)
                  return (
                    <span
                      key={sp.specialty_code}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-surface text-primary font-mono text-[11px] font-bold border border-primary/40"
                    >
                      <span>#{idx + 1} {sp.specialty_name}</span>
                      <strong className="text-secondary">({proj?.ticketCode})</strong>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSpecialty(sp.specialty_code)
                        }}
                        className="hover:text-error cursor-pointer ml-0.5"
                        title="Quitar"
                      >
                        ×
                      </button>
                    </span>
                  )
                })}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {specialtiesList.length > 0 ? (
                specialtiesList.map((sp) => {
                  const isSelected = selectedSpecialtyCodes.includes(sp.specialty_code)
                  const selectedIndex = selectedSpecialtyCodes.indexOf(sp.specialty_code)
                  const disponible = sp.cupo_disponible ?? (sp.cupo_maximo - (sp.cupo_ocupado ?? 0))
                  const sinCupo = disponible <= 0
                  const nextNum = (sp.cupo_ocupado ?? 0) + 1
                  const projectedCode = `${sp.specialty_code}-${String(nextNum).padStart(4, '0')}`

                  return (
                    <div
                      key={sp.specialty_code}
                      onClick={() => !sinCupo && toggleSpecialty(sp.specialty_code)}
                      className={`p-3.5 border transition-all cursor-pointer relative flex flex-col justify-between select-none ${
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-sm ring-2 ring-primary'
                          : sinCupo
                          ? 'bg-surface-container-low/50 border-surface-container-high opacity-50 cursor-not-allowed'
                          : 'bg-surface-container-low border-surface-container-high hover:border-primary/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-black uppercase px-2 py-0.5 bg-surface border border-surface-container-high text-primary">
                              {sp.specialty_code}
                            </span>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 bg-primary text-on-primary text-[10px] font-mono font-bold flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[12px]">check</span>
                                #{selectedIndex + 1}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 uppercase ${
                              sinCupo
                                ? 'bg-error-container text-error'
                                : disponible <= 5
                                ? 'bg-amber-500/20 text-amber-500'
                                : 'bg-emerald-500/20 text-emerald-500'
                            }`}
                          >
                            {sinCupo ? 'Agotado' : `${disponible} cupos libres`}
                          </span>
                        </div>

                        <div className="font-bold text-sm text-on-surface leading-tight mt-1 flex items-start justify-between gap-1">
                          <span>{sp.specialty_name}</span>
                          <span className={`material-symbols-outlined text-[18px] shrink-0 ${isSelected ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                            {isSelected ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                        </div>

                        <div className="text-[11px] text-on-surface-variant mt-1">
                          {sp.medico_nombre ? `Dr. ${sp.medico_nombre}` : 'Médico General de Guardia'}
                        </div>

                        <div className="mt-2 text-[11px] font-mono font-bold text-secondary">
                          Turno proyectado: <strong className="text-primary">#{projectedCode}</strong>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-surface-container-high flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
                        <span>{sp.consultorio || 'Consultorio 01'}</span>
                        <span>
                          {sp.cupo_ocupado ?? 0}/{sp.cupo_maximo} atendidos
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-3 p-4 bg-surface-container-low text-xs text-on-surface-variant text-center">
                  Cargando especialidades médicas configuradas para esta campaña...
                </div>
              )}
            </div>
          </section>

          {/* Motivo de consulta */}
          <section className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Motivo de Consulta o Molestia Principal
            </label>
            <textarea
              rows={2}
              className="w-full p-3 bg-surface-container-low text-xs text-on-surface border border-surface-container-high focus:border-primary focus:bg-surface focus:outline-none placeholder:text-on-surface-variant/40 placeholder:italic"
              placeholder="Ej. Control general, dolor articular lumbar, cefalea persistente o malestar..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </section>
        </div>

        {/* Right Column: Ticket Dispatcher & Recent List */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Card: Generación de Ticket */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="text-xs uppercase tracking-widest text-primary font-bold font-mono mb-1">
              Asignación Inmediata de Turnos
            </div>
            <h3 className="text-base font-semibold text-on-surface mb-4">
              {projectedTickets.length > 1
                ? `Tickets de Atención (${projectedTickets.length} Especialidades)`
                : 'Ticket de Especialidad Médica'}
            </h3>

            <div className="bg-surface-container p-4 border border-surface-container-high text-center mb-5">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-secondary">
                {lastAssignedTicket ? 'Último(s) Turno(s) Asignado(s)' : 'Código(s) de Turno'}
              </div>

              {lastAssignedTicket ? (
                <div className="my-2">
                  <div className="text-2xl font-mono font-black text-primary tracking-wider break-words">
                    {lastAssignedTicket}
                  </div>
                  <div className="text-xs text-on-surface font-bold uppercase mt-1">
                    {assignedTickets.map((t) => t.especialidad).filter(Boolean).join(' • ') || 'Atenciones Registradas'}
                  </div>
                </div>
              ) : projectedTickets.length === 0 ? (
                <div className="my-3">
                  <div className="text-4xl font-mono font-black text-on-surface-variant/40 tracking-widest">
                    ----
                  </div>
                  <div className="text-xs text-on-surface-variant font-bold uppercase mt-1">
                    Sin Especialidad Seleccionada
                  </div>
                  <div className="text-[11px] text-on-surface-variant mt-1">
                    Seleccione una o más especialidades para generar los turnos
                  </div>
                </div>
              ) : projectedTickets.length === 1 ? (
                <div className="my-2">
                  <div className="text-4xl font-mono font-black text-primary tracking-wider my-1">
                    #{projectedTickets[0].ticketCode}
                  </div>
                  <div className="text-xs text-on-surface font-bold uppercase mt-1">
                    {projectedTickets[0].specialty_name}
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    {projectedTickets[0].consultorio} • {projectedTickets[0].medico_nombre ? `Dr. ${projectedTickets[0].medico_nombre}` : 'Médico Asignado'}
                  </div>
                  <div className="mt-2 text-[11px] font-mono px-2 py-0.5 inline-block bg-surface border border-surface-container-high text-secondary">
                    Cupos Libres: <strong className="text-primary">{projectedTickets[0].cupo_disponible}</strong> de {projectedTickets[0].cupo_maximo}
                  </div>
                </div>
              ) : (
                <div className="my-2 space-y-2">
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {projectedTickets.map((pt) => (
                      <span
                        key={pt.specialty_code}
                        className="px-2.5 py-1 text-base font-mono font-black text-primary bg-surface border-2 border-primary tracking-wider"
                      >
                        #{pt.ticketCode}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-on-surface font-bold uppercase">
                    {projectedTickets.map((pt) => pt.specialty_name).join(' • ')}
                  </div>
                  <div className="text-[11px] text-primary font-bold">
                    Se generarán {projectedTickets.length} tickets individuales y se imprimirán en una sola pasada.
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={
                  submitting ||
                  selectedSpecialtyCodes.length === 0 ||
                  selectedSpecialties.some((s) => (s.cupo_disponible ?? (s.cupo_maximo - (s.cupo_ocupado ?? 0))) <= 0)
                }
                onClick={handleSubmit}
                className="w-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-bold py-3.5 px-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs rounded-none cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">
                  {submitting ? 'sync' : 'print'}
                </span>
                <span>
                  {submitting
                    ? 'Guardando en BD...'
                    : selectedSpecialtyCodes.length === 0
                    ? 'Seleccione Especialidad(es)'
                    : selectedSpecialtyCodes.length === 1
                    ? 'Grabar e Imprimir Ticket de Atención'
                    : `Grabar e Imprimir los ${selectedSpecialtyCodes.length} Tickets Juntos`}
                </span>
              </button>

              <div className="p-3 bg-surface-container-low text-[11px] text-on-surface-variant text-center border border-surface-container-high leading-relaxed">
                <div className="flex items-center justify-center gap-1 font-bold text-primary mb-1">
                  <span className="material-symbols-outlined text-[15px]">print</span>
                  <span>Impresión Térmica en Admisión Habilitada</span>
                </div>
                {projectedTickets.length > 0 ? (
                  <>
                    Turno(s) proyectado(s):{' '}
                    <strong className="text-primary font-mono">
                      {projectedTickets.map((p) => '#' + p.ticketCode).join(', ')}
                    </strong>
                    . Al registrar, se grabarán y saldrán todos los tickets juntos en el rollo de papel para entregárselos al paciente.
                  </>
                ) : (
                  <>Complete los datos del paciente y elija las especialidades requeridas.</>
                )}
              </div>
            </div>
          </div>

          {/* Card: Pacientes Registrados Recientemente */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider">
                Registrados Recientes ({atencionesList.length})
              </h3>
              <span className="text-[11px] font-mono text-tertiary font-bold">Historial de Turnos</span>
            </div>

            <div className="space-y-2 divide-y divide-surface-container-high max-h-[350px] overflow-y-auto">
              {atencionesList.length > 0 ? (
                atencionesList.slice(0, 15).map((atn) => {
                  const ape = atn.apellidos || atn.beneficiario?.apellidos || 'PACIENTE'
                  const nom = atn.nombres || atn.beneficiario?.nombres || ''
                  const doc = atn.dni || atn.beneficiario?.dni || '--------'
                  const esp = atn.specialty_name || 'Medicina General'
                  const tkt = atn.ticket_codigo || `T-${atn.ticket_number}`
                  return (
                    <div key={atn.id} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-on-surface uppercase">
                          {ape}, {nom}
                        </div>
                        <div className="text-[11px] text-secondary font-mono">
                          DNI: {doc} • {esp}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-primary-container text-on-primary-container border border-primary/20 whitespace-nowrap">
                          {tkt}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const corr = atn.ticket_number || (tkt ? tkt.match(/(\d+)$/)?.[1] : undefined)
                            const singleTicket: TicketInfo = {
                              ticket: String(corr || tkt || '1'),
                              correlativo: corr,
                              paciente: `${ape}, ${nom}`,
                              dni: doc,
                              edad: atn.edad_calculada ? `${atn.edad_calculada} años` : (atn.fecha_nacimiento ? `${calculateAge(atn.fecha_nacimiento)} años` : undefined),
                              comunidad: atn.comunidad || 'Comunidad General',
                              distrito: atn.distrito || atn.comunidad || 'Urubamba',
                              fecha: atn.arrival_time ? new Date(atn.arrival_time).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                              hora: atn.arrival_time ? new Date(atn.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
                              especialidad: esp,
                              consultorio: atn.consultorio || 'Consultorio 01',
                            }
                            setAssignedTickets([singleTicket])
                            setAssignedTicketInfo(singleTicket)
                            setTicketModalOpen(true)
                          }}
                          className="p-1 hover:bg-surface-container border border-surface-container-high text-primary cursor-pointer"
                          title="Reimprimir ticket individual de este paciente"
                        >
                          <span className="material-symbols-outlined text-[16px]">print</span>
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-xs text-on-surface-variant text-center py-4">
                  No hay pacientes registrados aún.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Agregar Nueva Comunidad */}
      {isAddingComunidad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-surface-container-high shadow-2xl flex flex-col overflow-hidden text-on-surface animate-scale-in">
            {/* Header */}
            <div className="px-5 py-3.5 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  location_city
                </span>
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Agregar Nueva Comunidad / Sector
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingComunidad(false)
                  setNewComunidadName('')
                }}
                className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
              <p className="text-xs text-on-surface-variant">
                Ingrese el nombre de la comunidad, anexo o sector rural. Quedará guardada en el catálogo y se seleccionará automáticamente para este registro.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1">
                  Nombre de la Comunidad:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Rumichaca Alto, Yanahuara, Sector Piri..."
                  value={newComunidadName}
                  onChange={(e) => setNewComunidadName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSaveNewComunidad()
                    }
                  }}
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm border border-surface-container-high focus:border-primary focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-3.5 bg-surface-container-low border-t border-surface-container-high flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsAddingComunidad(false)
                  setNewComunidadName('')
                }}
                className="h-9 px-4 border border-surface-container-highest text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer rounded-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNewComunidad}
                disabled={!newComunidadName.trim()}
                className="h-9 px-4 bg-primary text-on-primary hover:bg-on-primary-fixed-variant disabled:opacity-50 text-xs font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer rounded-none shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Guardar y Seleccionar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Impresión Térmica Inmediata del Ticket Asignado */}
      <TicketModal
        isOpen={ticketModalOpen}
        onClose={() => {
          setTicketModalOpen(false)
          setAssignedTickets([])
          setAssignedTicketInfo(null)
        }}
        tickets={assignedTickets}
        info={assignedTicketInfo}
        mode="admision"
        autoPrint={true}
        onNext={() => {
          setTicketModalOpen(false)
          setAssignedTickets([])
          setAssignedTicketInfo(null)
        }}
        nextLabel="Aceptar y Registrar Siguiente Paciente"
      />

    </div>
  )
}
