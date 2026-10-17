import { useState } from 'react'
import {
  useStoreBeneficiario,
  useReniecLookup,
  useStoreAtencion,
  useAtenciones,
  useCampaigns,
  useCampaignSpecialties,
} from '../../api/hooks'
import { PATIENT_DATABASE } from '../../services/patientRegistry'

export default function BeneficiarioPage() {
  const [dni, setDni] = useState('')
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
  const [assignedTicketInfo, setAssignedTicketInfo] = useState<{
    ticket: string
    paciente: string
    dni: string
    comunidad: string
    hora: string
    especialidad?: string
    medico?: string
    consultorio?: string
  } | null>(null)

  // Inicia en blanco (sin especialidad preseleccionada) para que el voluntario indique la necesaria
  const [selectedSpecialtyCode, setSelectedSpecialtyCode] = useState<string>('')

  const reniecLookup = useReniecLookup()
  const createBeneficiario = useStoreBeneficiario()
  const createAtencion = useStoreAtencion()
  const { data: atencionesData } = useAtenciones()
  const atencionesList: any[] = Array.isArray(atencionesData)
    ? atencionesData
    : (Array.isArray(atencionesData?.data) ? atencionesData.data : [])

  // Campaña activa y catálogo de especialidades con cupos en tiempo real
  const { data: campaignsList = [] } = useCampaigns('active')
  const activeCampaign = campaignsList[0]
  const currentCampaignId = activeCampaign ? activeCampaign.id : 1
  const { data: specialtiesList = [] } = useCampaignSpecialties(currentCampaignId)

  // Especialidad seleccionada y cálculo de turno proyectado (solo si hay especialidad elegida)
  const currentSpecialty = selectedSpecialtyCode
    ? specialtiesList.find((s) => s.specialty_code === selectedSpecialtyCode) || null
    : null

  const nextSpecialtyNumber = currentSpecialty
    ? (currentSpecialty.cupo_ocupado ?? 0) + 1
    : null
  const projectedTicketCode = currentSpecialty
    ? `${currentSpecialty.specialty_code}-${String(nextSpecialtyNumber).padStart(4, '0')}`
    : null

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
      if (p.comunidad) setComunidad(p.comunidad)
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
        setMessage({
          text: `✓ Paciente preexistente en padrón: ${nom} ${ape}. Todos sus datos fueron autollenados. Por favor complete los datos faltantes como la ESPECIALIDAD requerida.`,
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
    if (cleanDni.length !== 8 || !/^\d{8}$/.test(cleanDni)) {
      setMessage({ text: 'Por favor ingrese un número de DNI válido de 8 dígitos numéricos.', type: 'error' })
      return
    }
    if (!nombres.trim() || !apellidos.trim()) {
      setMessage({ text: 'Debe ingresar nombres y apellidos completos.', type: 'error' })
      return
    }
    if (!fechaNac) {
      setMessage({ text: 'Debe ingresar la fecha de nacimiento.', type: 'error' })
      return
    }

    if (!selectedSpecialtyCode || !currentSpecialty) {
      setMessage({
        text: '⚠️ Por favor seleccione la Especialidad Médica que necesita el paciente para poder crear su código de turno.',
        type: 'error',
      })
      return
    }

    if ((currentSpecialty.cupo_disponible ?? 1) <= 0) {
      setMessage({
        text: `No hay cupos disponibles para la especialidad ${currentSpecialty.specialty_name}. Por favor seleccione otra especialidad médica disponible.`,
        type: 'error',
      })
      return
    }

    setSubmitting(true)
    try {
      // 1. Guardar todos los campos del paciente que aparecen en pantalla
      const b = await createBeneficiario.mutateAsync({
        dni: cleanDni,
        nombres: nombres.trim().toUpperCase(),
        apellidos: apellidos.trim().toUpperCase(),
        fecha_nacimiento: fechaNac,
        sexo,
        estado_civil: estadoCivil || undefined,
        idioma_principal: idioma || undefined,
        comunidad: comunidad || undefined,
        celular: telefono || undefined,
        telefono: telefono || undefined,
        altitud_residencia: altitud || undefined,
        tipo_seguro: seguro || 'ninguno',
        alergias: alergias || undefined,
        antecedentes: [
          hipertension ? 'Hipertensión' : '',
          diabetes ? 'Diabetes' : '',
          asma ? 'Asma/EPOC' : '',
          anemia ? 'Anemia' : '',
          gestante ? 'Gestante' : '',
        ].filter(Boolean).join(', ') || undefined,
      })

      // 2. Extraer identificador único garantizado del beneficiario
      const benefId = Number(b?.id || (b as any)?.data?.id || (b as any)?.beneficiario?.id)
      if (!benefId) {
        throw new Error('No se pudo obtener el identificador del paciente guardado.')
      }

      // 3. Asignar nuevo número de atención por especialidad seleccionada
      const atencion = await createAtencion.mutateAsync({
        beneficiario_id: benefId,
        campaign_id: currentCampaignId,
        seguro_usado: seguro || 'ninguno',
        notes: `Motivo: ${motivo || 'Control general'} | Traslado: ${tiempoViaje || '0'} min | Alergias: ${alergias || 'Ninguna'}`,
        specialty_code: currentSpecialty?.specialty_code || 'MED',
        specialty_name: currentSpecialty?.specialty_name || 'Medicina General',
        medico_id: currentSpecialty?.medico_id || undefined,
        consultorio: currentSpecialty?.consultorio || 'Consultorio 01',
      })

      const ticketAsignado = atencion.ticket_codigo || projectedTicketCode || `${currentSpecialty.specialty_code}-0001`
      setLastAssignedTicket(ticketAsignado)
      setAssignedTicketInfo({
        ticket: ticketAsignado,
        paciente: `${apellidos.trim().toUpperCase()}, ${nombres.trim().toUpperCase()}`,
        dni: cleanDni,
        comunidad: comunidad || 'Comunidad General',
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        especialidad: atencion.specialty_name || currentSpecialty.specialty_name,
        medico: atencion.medico_asignado_nombre || currentSpecialty.medico_nombre || 'Médico Asignado',
        consultorio: atencion.consultorio || currentSpecialty.consultorio || 'Consultorio 01',
      })
      setTicketModalOpen(true)

      setMessage({
        text: `✓ ¡Paciente registrado con éxito! Turno Asignado: #${ticketAsignado} (${currentSpecialty.specialty_name}) para ${apellidos.trim().toUpperCase()}, ${nombres.trim().toUpperCase()}. La mesa de acreditación ha pasado a un nuevo registro en blanco.`,
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
      setSelectedSpecialtyCode('')
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
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-primary-container text-on-primary-fixed">
              ADM-01
            </span>
            <span className="px-2 py-0.5 text-[11px] font-medium bg-surface-container text-on-surface-variant flex items-center gap-1.5 border border-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              Campaña Activa: Cusco - Valle Sagrado 2025
            </span>
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

        <div className="flex items-start bg-[#fff8e1] p-3 border border-[#ffe082] shadow-xs">
          <div className="mr-3 text-[#b78103]">
            <span className="material-symbols-outlined text-[20px]">notification_important</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#5c4100]">Control de Historial Comunal</div>
              <span className="text-[10px] font-mono text-[#5c4100] font-bold">EXP-2024-CUS</span>
            </div>
            <div className="text-xs text-[#5c4100] mt-0.5">
              Al ingresar el DNI el sistema verifica si el paciente ya fue atendido en jornadas anteriores.
            </div>
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
              <span className="text-xs text-on-surface-variant font-mono">* Campos obligatorios</span>
            </div>

            <div className="space-y-4">
              {/* DNI with RENIEC API Lookup */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-7">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Documento Nacional de Identidad (DNI) *
                  </label>
                  <div className="relative flex border border-surface-container-high bg-surface-container-low focus-within:border-primary focus-within:bg-surface">
                    <input
                      className="w-full h-10 px-3 bg-transparent text-on-surface text-sm font-mono placeholder:text-on-surface-variant/40 placeholder:italic focus:outline-none"
                      maxLength={8}
                      placeholder="Ingrese 8 dígitos de DNI"
                      type="text"
                      value={dni}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '')
                        setDni(clean)
                        if (clean.length === 8) {
                          handleReniec(clean)
                        } else if (clean.length < 8 && patientExists) {
                          setPatientExists(false)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleReniec()
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={isSearchingReniec}
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
                    <div className="flex items-center gap-1.5 text-tertiary font-bold bg-tertiary-container/30 px-2.5 py-1 border border-tertiary/30">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Paciente en Padrón (Autollenado)</span>
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
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    F. Nacimiento *
                  </label>
                  <input
                    className="w-full h-10 px-2 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none"
                    type="date"
                    value={fechaNac}
                    onChange={(e) => setFechaNac(e.target.value)}
                  />
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

                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Sexo Biológico *
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

                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Lengua Materna *
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
              </div>
            </div>
          </section>

          {/* SECTION 2: Residencia y Contacto */}
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

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Comunidad / Sector Rural *
                </label>
                <select
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                  value={comunidad}
                  onChange={(e) => setComunidad(e.target.value)}
                >
                  <option value="rumichaca">Rumichaca (Sector Alto)</option>
                  <option value="ollantaytambo">Ollantaytambo (Comunidad Willoq)</option>
                  <option value="marcas">Marcas - Huayllabamba</option>
                  <option value="urubamba">Urubamba Centro</option>
                  <option value="yanahuara">Yanahuara</option>
                </select>
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Móvil / WhatsApp de Contacto
                </label>
                <div className="flex border border-surface-container-high bg-surface-container-low focus-within:border-primary">
                  <span className="h-10 px-3 bg-surface-container text-xs text-on-surface-variant flex items-center font-mono">
                    +51
                  </span>
                  <input
                    className="w-full h-10 px-3 bg-transparent text-on-surface text-sm placeholder:text-on-surface-variant/40 placeholder:italic focus:outline-none"
                    type="tel"
                    placeholder="Ej. 984 312 809"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Altitud Habitual (msnm)
                </label>
                <div className="relative border border-surface-container-high bg-surface-container-low">
                  <input
                    className="w-full h-10 px-3 bg-transparent text-on-surface text-sm focus:outline-none"
                    type="number"
                    value={altitud}
                    onChange={(e) => setAltitud(Number(e.target.value))}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-on-surface-variant">msnm</span>
                </div>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Tiempo de Traslado a pie
                </label>
                <select
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                  value={tiempoViaje}
                  onChange={(e) => setTiempoViaje(e.target.value)}
                >
                  <option value="30">Menos de 30 min</option>
                  <option value="60">30 min a 1 hora</option>
                  <option value="120">1 a 2 horas a pie</option>
                  <option value="180">Más de 2 horas a pie</option>
                </select>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Afiliación a Seguro Médico *
                </label>
                <select
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                  value={seguro}
                  onChange={(e) => setSeguro(e.target.value as 'sis' | 'essalud' | 'ninguno' | 'privado')}
                >
                  <option value="sis">SIS Gratuito Subsidiado</option>
                  <option value="essalud">EsSalud (Seguro Social)</option>
                  <option value="ninguno">Sin Seguro / No Afiliado</option>
                  <option value="privado">Seguro Privado / FFAA</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECTION 3: Antecedentes & Factores de Riesgo */}
          <section className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-on-primary text-xs font-semibold flex items-center justify-center">
                  3
                </span>
                <h2 className="text-sm font-semibold tracking-tight text-on-surface uppercase">
                  Antecedentes &amp; Factores de Riesgo Crónico
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">Marcaje rápido de tamizaje</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
            </div>

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
          </section>

          {/* SECTION 4: Selección de Especialidad Médica */}
          <section className="bg-surface p-6 shadow-xs border border-surface-container-high space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-on-primary text-xs font-semibold flex items-center justify-center">
                  4
                </span>
                <h2 className="text-sm font-semibold tracking-tight text-on-surface uppercase">
                  ¿A qué Especialidad Médica desea asistir? *
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">Cupos médicos limitados por jornada</span>
            </div>

            {!selectedSpecialtyCode && (
              <div className="p-3 bg-primary-container/40 text-on-primary-container text-xs flex items-center gap-2 border border-primary/30">
                <span className="material-symbols-outlined text-[18px] text-primary">priority_high</span>
                <span className="font-semibold">
                  Seleccione la especialidad médica que necesita el paciente para asignarle su turno de atención.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {specialtiesList.length > 0 ? (
                specialtiesList.map((sp) => {
                  const isSelected = selectedSpecialtyCode === sp.specialty_code
                  const disponible = sp.cupo_disponible ?? (sp.cupo_maximo - (sp.cupo_ocupado ?? 0))
                  const sinCupo = disponible <= 0

                  return (
                    <div
                      key={sp.specialty_code}
                      onClick={() => !sinCupo && setSelectedSpecialtyCode(sp.specialty_code)}
                      className={`p-3.5 border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-sm ring-2 ring-primary'
                          : sinCupo
                          ? 'bg-surface-container-low/50 border-surface-container-high opacity-50 cursor-not-allowed'
                          : 'bg-surface-container-low border-surface-container-high hover:border-primary/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-black uppercase px-2 py-0.5 bg-surface border border-surface-container-high text-primary">
                            {sp.specialty_code}
                          </span>
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

                        <div className="font-bold text-sm text-on-surface leading-tight">
                          {sp.specialty_name}
                        </div>

                        <div className="text-[11px] text-on-surface-variant mt-1">
                          {sp.medico_nombre ? `Dr. ${sp.medico_nombre}` : 'Médico General de Guardia'}
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
              Asignación Inmediata de Turno
            </div>
            <h3 className="text-base font-semibold text-on-surface mb-4">
              Ticket de Especialidad Médica
            </h3>

            <div className="bg-surface-container p-4 border border-surface-container-high text-center mb-5">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-secondary">
                {lastAssignedTicket ? 'Último Turno Asignado' : 'Código de Turno'}
              </div>
              <div className="text-4xl font-mono font-black my-1 tracking-wider">
                {lastAssignedTicket ? (
                  <span className="text-primary">#{lastAssignedTicket}</span>
                ) : projectedTicketCode ? (
                  <span className="text-primary">#{projectedTicketCode}</span>
                ) : (
                  <span className="text-on-surface-variant/40 tracking-widest">----</span>
                )}
              </div>
              <div className="text-xs text-on-surface font-bold uppercase mt-1">
                {lastAssignedTicket && assignedTicketInfo
                  ? assignedTicketInfo.especialidad
                  : currentSpecialty
                  ? currentSpecialty.specialty_name
                  : 'Sin Especialidad Seleccionada'}
              </div>
              <div className="text-[11px] text-on-surface-variant">
                {lastAssignedTicket && assignedTicketInfo
                  ? `${assignedTicketInfo.paciente} • DNI: ${assignedTicketInfo.dni}`
                  : currentSpecialty
                  ? `${currentSpecialty.consultorio || 'Consultorio 01'} • ${currentSpecialty.medico_nombre ? `Dr. ${currentSpecialty.medico_nombre}` : 'Médico de Turno'}`
                  : 'El código se creará automáticamente al registrar al paciente'}
              </div>
              {currentSpecialty ? (
                <div className="mt-2 text-[11px] font-mono px-2 py-0.5 inline-block bg-surface border border-surface-container-high text-secondary">
                  Cupos Libres: <strong className="text-primary">{currentSpecialty.cupo_disponible ?? 30}</strong> de {currentSpecialty.cupo_maximo ?? 30}
                </div>
              ) : (
                <div className="mt-2 text-[10.5px] font-mono px-2 py-0.5 inline-block bg-surface border border-dashed border-surface-container-high text-on-surface-variant">
                  Mesa en blanco • Ingrese DNI y especialidad
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={submitting || (currentSpecialty ? (currentSpecialty.cupo_disponible ?? 1) <= 0 : false)}
                onClick={handleSubmit}
                className="w-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-bold py-3.5 px-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs rounded-none cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">
                  {submitting ? 'sync' : 'how_to_reg'}
                </span>
                <span>{submitting ? 'Guardando en BD...' : 'Registrar Paciente y Asignar Turno'}</span>
              </button>

              <div className="p-3 bg-surface-container-low text-[11px] text-on-surface-variant text-center border border-surface-container-high leading-relaxed">
                <div className="flex items-center justify-center gap-1 font-bold text-secondary mb-1">
                  <span className="material-symbols-outlined text-[15px]">info</span>
                  <span>Sin impresión en Admisión / Acreditación</span>
                </div>
                {projectedTicketCode ? (
                  <>El turno <strong className="text-primary font-mono">{projectedTicketCode}</strong> se generará al registrar. </>
                ) : (
                  <>Complete los datos del paciente y elija la especialidad requerida. </>
                )}
                El paciente pasará a la <strong>lista de Triaje</strong> donde se evaluarán signos vitales y se imprimirá su ticket definitivo.
              </div>
            </div>
          </div>

          {/* Card: Pacientes Registrados Recientemente */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider">
                Registrados Recientes ({atencionesList.length})
              </h3>
              <span className="text-[11px] font-mono text-tertiary font-bold">En cola Triaje</span>
            </div>

            <div className="space-y-2 divide-y divide-surface-container-high max-h-[350px] overflow-y-auto">
              {atencionesList.length > 0 ? (
                atencionesList.slice(0, 10).map((atn) => {
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
                      <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-primary-container text-on-primary-container border border-primary/20 whitespace-nowrap">
                        {tkt}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="text-xs text-on-surface-variant text-center py-4">
                  No hay pacientes en cola de triaje aún.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Emergente con el Nuevo Número de Ticket Asignado */}
      {ticketModalOpen && assignedTicketInfo && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border-2 border-primary shadow-2xl w-full max-w-md p-6 text-on-surface text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-3 bg-tertiary-container text-tertiary flex items-center justify-center rounded-full border border-tertiary/30">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>

            <div className="text-xs uppercase tracking-widest text-secondary font-bold font-mono">
              Admisión Completada con Éxito
            </div>

            <h2 className="text-xl font-black uppercase text-on-surface mt-1">
              Nuevo Turno Asignado
            </h2>

            {/* Recuadro de Turno Gigante */}
            <div className="my-4 p-4 bg-primary/10 border-2 border-dashed border-primary">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-secondary block">
                CÓDIGO DE ATENCIÓN MÉDICA
              </span>
              <span className="text-5xl font-mono font-black text-primary my-1 block tracking-wider">
                #{assignedTicketInfo.ticket}
              </span>
              <div className="text-xs font-bold uppercase text-on-surface mt-1">
                {assignedTicketInfo.especialidad}
              </div>
              <div className="text-xs font-mono text-on-surface-variant">
                Destino: {assignedTicketInfo.consultorio || 'Consultorio 01'} • {assignedTicketInfo.medico || 'Médico Asignado'}
              </div>
            </div>

            {/* Datos del Paciente */}
            <div className="bg-surface-container p-3 border border-surface-container-high text-xs text-left mb-4 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Paciente:</span>
                <strong className="text-on-surface uppercase">{assignedTicketInfo.paciente}</strong>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-on-surface-variant">DNI:</span>
                <strong className="text-on-surface">{assignedTicketInfo.dni}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Comunidad:</span>
                <span className="text-on-surface capitalize">{assignedTicketInfo.comunidad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Hora de Ingreso:</span>
                <span className="text-on-surface font-mono">{assignedTicketInfo.hora}</span>
              </div>
            </div>

            {/* Aviso de flujo */}
            <div className="p-3 bg-secondary-container/30 border border-secondary/30 text-xs text-left mb-5">
              <div className="flex items-center gap-1.5 font-bold text-secondary mb-1">
                <span className="material-symbols-outlined text-[16px]">campaign</span>
                <span>Instrucciones para el Paciente</span>
              </div>
              <p className="text-[11.5px] text-on-surface leading-relaxed">
                El paciente debe aguardar en la sala de espera. <strong>Será llamado en Triaje por su apellido</strong> para la evaluación de constantes vitales y la entrega de su ticket físico.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setTicketModalOpen(false)
                setAssignedTicketInfo(null)
              }}
              className="w-full py-3.5 bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-colors"
            >
              Aceptar y Registrar Siguiente Paciente
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
