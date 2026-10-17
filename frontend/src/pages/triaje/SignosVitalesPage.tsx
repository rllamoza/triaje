import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { useStoreTriaje, useAtenciones } from '../../api/hooks'
import { printThermalElement } from '../../utils/printEngine'
import { useBrandingStore, getEffectiveTicketLogo } from '../../store/brandingStore'

export default function SignosVitalesPage() {
  const [searchParams] = useSearchParams()
  const atencionIdFromParam = searchParams.get('atencion_id') ? Number(searchParams.get('atencion_id')) : null

  const branding = useBrandingStore()
  const effectiveLogo = getEffectiveTicketLogo(branding)

  const { data: atencionesData } = useAtenciones({ per_page: 200 })
  const atencionesList: any[] = Array.isArray(atencionesData)
    ? atencionesData
    : (Array.isArray(atencionesData?.data) ? atencionesData.data : [])

  const [selectedAtencionId, setSelectedAtencionId] = useState<number | null>(atencionIdFromParam)
  const [filterQuery, setFilterQuery] = useState('')
  const [llamando, setLlamando] = useState(false)

  useEffect(() => {
    if (atencionIdFromParam) {
      setSelectedAtencionId(atencionIdFromParam)
    } else if (atencionesList.length > 0) {
      if (!selectedAtencionId || !atencionesList.some((a) => a.id === selectedAtencionId)) {
        const firstWaiting = atencionesList.find((a) => a.status === 'en_espera_triaje')
        setSelectedAtencionId(firstWaiting ? firstWaiting.id : atencionesList[0].id)
      }
    }
  }, [atencionIdFromParam, atencionesList, selectedAtencionId])

  const activeAtencion = atencionesList.find((a) => a.id === selectedAtencionId) || (atencionesList.length > 0 ? atencionesList[0] : null)

  // Extraer datos fidedignos del paciente activo
  const rawBene = activeAtencion?.beneficiario || (activeAtencion as any)
  const pacienteApellidos = activeAtencion?.apellidos || rawBene?.apellidos || (activeAtencion ? 'PACIENTE' : 'Sin Paciente')
  const pacienteNombres = activeAtencion?.nombres || rawBene?.nombres || (activeAtencion ? 'REGISTRADO' : 'Seleccionado')
  const pacienteDni = activeAtencion?.dni || rawBene?.dni || (activeAtencion ? '--------' : '--------')
  const pacienteEdad = activeAtencion?.edad_calculada
    ? `${activeAtencion.edad_calculada} años`
    : (rawBene?.edad_calculada ? `${rawBene.edad_calculada} años` : 'Edad no reg.')
  const pacienteSexo = activeAtencion?.sexo || rawBene?.sexo || 'M'
  const pacienteSeguro = activeAtencion?.tipo_seguro || rawBene?.tipo_seguro || activeAtencion?.seguro_usado || 'SIS Activo'
  const pacienteComunidad = activeAtencion?.comunidad || rawBene?.comunidad || 'Comunidad General'
  const pacienteAlergias =
    rawBene?.alergias ||
    (rawBene?.alergias_activas
      ? Array.isArray(rawBene.alergias_activas)
        ? rawBene.alergias_activas.join(', ')
        : String(rawBene.alergias_activas)
      : null)
  const campanaNombre = (activeAtencion as any)?.campaign_name || 'Campaña Activa de Salud'
  const boxNombre = (activeAtencion as any)?.station_label || 'Box: Triaje 01'
  const ticketCodigo = activeAtencion?.ticket_codigo || (activeAtencion ? `T-${activeAtencion.ticket_number}` : '---')
  const especialidadNombre = (activeAtencion as any)?.specialty_name || 'Medicina General'
  const consultorioDestino = (activeAtencion as any)?.consultorio || 'Consultorio 01'
  const medicoAsignado = (activeAtencion as any)?.medico_asignado_nombre || 'Médico Asignado'
  const horaLlegada = activeAtencion?.arrival_time
    ? new Date(activeAtencion.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--'
  const motivoConsulta = (activeAtencion as any)?.notes || rawBene?.motivo || 'Evaluación de constantes vitales en triaje'


  // Prioridad Manchester (1: Rojo, 2: Amarillo, 3: Verde)
  const [priority, setPriority] = useState<1 | 2 | 3>(2)

  // Signos Vitales: INICIAN EN BLANCO al seleccionar el ticket del paciente registrado
  const [paSistolica, setPaSistolica] = useState<string>('')
  const [paDiastolica, setPaDiastolica] = useState<string>('')
  const [fc, setFc] = useState<string>('')
  const [fr, setFr] = useState<string>('')
  const [temperatura, setTemperatura] = useState<string>('')
  const [spo2, setSpo2] = useState<string>('')
  const [glucosa, setGlucosa] = useState<string>('')
  const [peso, setPeso] = useState<string>('')
  const [talla, setTalla] = useState<string>('')
  const [glasgow, setGlasgow] = useState<string>('')
  const [observaciones, setObservaciones] = useState<string>('')

  // Control de validación y UI
  const [touchedValidation, setTouchedValidation] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  // Cuando se selecciona un ticket de la lista de pacientes registrados:
  // Se carga la info del paciente y se ponen los campos de triaje en blanco
  useEffect(() => {
    setPaSistolica('')
    setPaDiastolica('')
    setFc('')
    setFr('')
    setTemperatura('')
    setSpo2('')
    setGlucosa('')
    setPeso('')
    setTalla('')
    setGlasgow('')
    setObservaciones('')
    setPriority(2)
    setTouchedValidation(false)
    setMessage(null)
  }, [selectedAtencionId])

  // Cálculo dinámico de IMC
  const numPeso = parseFloat(peso)
  const numTalla = parseFloat(talla)
  const imc = numPeso > 0 && numTalla > 0 ? (numPeso / (numTalla * numTalla)).toFixed(1) : null

  const getImcCategory = (val: number | null) => {
    if (!val) return 'Pendiente'
    if (val < 18.5) return 'Bajo Peso'
    if (val < 25) return 'Normal'
    if (val < 30) return 'Sobrepeso'
    return 'Obesidad'
  }
  const imcCategory = getImcCategory(imc ? parseFloat(imc) : null)

  // Estados Fisiológicos en tiempo real
  const getPaStatus = () => {
    if (!paSistolica.trim() || !paDiastolica.trim()) {
      return { label: 'Pendiente', color: 'text-on-surface-variant bg-surface-container-high' }
    }
    const sis = Number(paSistolica)
    const dia = Number(paDiastolica)
    if (sis >= 180 || dia >= 120) return { label: 'Crisis Hipertensiva', color: 'text-on-error bg-error' }
    if (sis >= 140 || dia >= 90) return { label: 'HTA Grado II', color: 'text-[#991b1b] bg-[#fee2e2]' }
    if (sis >= 130 || dia >= 80) return { label: 'HTA Grado I', color: 'text-[#92400e] bg-[#fef3c7]' }
    if (sis >= 120 && dia < 80) return { label: 'PA Elevada', color: 'text-[#92400e] bg-[#fef3c7]' }
    return { label: 'Normotenso', color: 'text-tertiary bg-tertiary-container' }
  }

  const getFcStatus = () => {
    if (!fc.trim()) return { label: 'Pendiente', color: 'text-on-surface-variant bg-surface-container-high' }
    const val = Number(fc)
    if (val > 100) return { label: 'Taquicardia', color: 'text-[#991b1b] bg-[#fee2e2]' }
    if (val < 60) return { label: 'Bradicardia', color: 'text-[#92400e] bg-[#fef3c7]' }
    return { label: 'Normocárdico', color: 'text-tertiary bg-tertiary-container' }
  }

  const getTempStatus = () => {
    if (!temperatura.trim()) return { label: 'Pendiente', color: 'text-on-surface-variant bg-surface-container-high' }
    const val = Number(temperatura)
    if (val >= 38.0) return { label: 'Febril / Alerta', color: 'text-on-error bg-error' }
    if (val >= 37.5) return { label: 'Febrícula', color: 'text-[#92400e] bg-[#fef3c7]' }
    if (val < 35.5) return { label: 'Hipotermia', color: 'text-[#991b1b] bg-[#fee2e2]' }
    return { label: 'Afebril', color: 'text-tertiary bg-tertiary-container' }
  }

  const getSpo2Status = () => {
    if (!spo2.trim()) return { label: 'Pendiente', color: 'text-on-surface-variant bg-surface-container-high' }
    const val = Number(spo2)
    if (val >= 90) return { label: 'Normal en Altura', color: 'text-tertiary bg-tertiary-container' }
    if (val >= 85) return { label: 'Hipoxia Leve (Altura)', color: 'text-[#92400e] bg-[#fef3c7]' }
    return { label: 'Hipoxia Severa (Oxígeno)', color: 'text-on-error bg-error' }
  }

  const getFrStatus = () => {
    if (!fr.trim()) return { label: 'Pendiente', color: 'text-on-surface-variant bg-surface-container-high' }
    const val = Number(fr)
    if (val > 20) return { label: 'Taquipneico', color: 'text-[#991b1b] bg-[#fee2e2]' }
    if (val < 12) return { label: 'Bradipneico', color: 'text-[#92400e] bg-[#fef3c7]' }
    return { label: 'Eupneico', color: 'text-tertiary bg-tertiary-container' }
  }

  const getGlucosaStatus = () => {
    if (!glucosa.trim()) return { label: 'Pendiente', color: 'text-on-surface-variant bg-surface-container-high' }
    const val = Number(glucosa)
    if (val > 140) return { label: 'Hiperglucemia', color: 'text-[#991b1b] bg-[#fee2e2]' }
    if (val < 70) return { label: 'Hipoglucemia', color: 'text-on-error bg-error' }
    return { label: 'Normoglucemia', color: 'text-tertiary bg-tertiary-container' }
  }

  const getGlasgowStatus = () => {
    if (!glasgow.trim()) return { label: 'Pendiente', color: 'text-on-surface-variant bg-surface-container-high' }
    const val = Number(glasgow)
    if (val === 15) return { label: 'Lúcido / Orientado', color: 'text-tertiary bg-tertiary-container' }
    if (val >= 13) return { label: 'Compromiso Leve', color: 'text-[#92400e] bg-[#fef3c7]' }
    if (val >= 9) return { label: 'Compromiso Moderado', color: 'text-[#991b1b] bg-[#fee2e2]' }
    return { label: 'Grave / Reanimación', color: 'text-on-error bg-error' }
  }

  // Generación de QR Clínico para Trazabilidad en el Ticket Térmico
  useEffect(() => {
    const payload = JSON.stringify({
      t: ticketCodigo,
      dni: pacienteDni,
      paciente: `${pacienteApellidos}, ${pacienteNombres}`,
      prioridad: priority === 1 ? 'I' : priority === 2 ? 'II' : 'III',
      pa: `${paSistolica || '—'}/${paDiastolica || '—'}`,
      fc: fc || '—',
      temp: temperatura || '—',
      spo2: spo2 || '—',
      fr: fr || '—',
      g: glasgow || '—',
      imc: imc || '—',
      fecha: new Date().toISOString().slice(0, 10),
    })

    QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 140,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('[QR Triaje] Error:', err))
  }, [
    ticketCodigo,
    pacienteDni,
    pacienteApellidos,
    pacienteNombres,
    priority,
    paSistolica,
    paDiastolica,
    fc,
    temperatura,
    spo2,
    fr,
    glasgow,
    imc,
  ])

  // Validación rigurosa de campos obligatorios
  const getMissingFields = () => {
    const missing: string[] = []
    if (!paSistolica.trim() || isNaN(Number(paSistolica))) missing.push('Presión Sistólica')
    if (!paDiastolica.trim() || isNaN(Number(paDiastolica))) missing.push('Presión Diastólica')
    if (!fc.trim() || isNaN(Number(fc))) missing.push('Frecuencia Cardíaca')
    if (!temperatura.trim() || isNaN(Number(temperatura))) missing.push('Temperatura')
    if (!spo2.trim() || isNaN(Number(spo2))) missing.push('SpO2')
    if (!fr.trim() || isNaN(Number(fr))) missing.push('Frecuencia Respiratoria')
    if (!glucosa.trim() || isNaN(Number(glucosa))) missing.push('Glucemia')
    if (!peso.trim() || isNaN(Number(peso))) missing.push('Peso')
    if (!talla.trim() || isNaN(Number(talla))) missing.push('Talla')
    if (!glasgow.trim() || isNaN(Number(glasgow))) missing.push('Escala Glasgow')
    return missing
  }

  const createTriaje = useStoreTriaje()

  const llamarPorApellido = (apellidos: string, turno: string, especialidad?: string) => {
    setLlamando(true)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
        const espTxt = especialidad ? `para ${especialidad}` : ''
        const text = `Atención paciente ${apellidos}, ticket ${turno} ${espTxt}, pasar al box de triaje.`
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'es-PE'
        utterance.rate = 0.95
        window.speechSynthesis.speak(utterance)
      } catch {}
    }
    setTimeout(() => setLlamando(false), 3500)
  }

  const handleSave = async (printSlip = false) => {
    setMessage(null)
    const missing = getMissingFields()

    if (missing.length > 0) {
      setTouchedValidation(true)
      setMessage({
        type: 'error',
        text: `⚠️ Campos obligatorios de triaje incompletos: Debe ingresar ${missing.join(', ')}. Los valores en gris tenue son solo ejemplos referenciales y no se registrarán si se dejan vacíos.`,
      })
      return
    }

    setSaving(true)
    try {
      const pMap: Record<number, { p: 'I' | 'II' | 'III'; color: 'rojo' | 'amarillo' | 'verde'; label: string }> = {
        1: { p: 'I', color: 'rojo', label: 'Emergencia (Rojo)' },
        2: { p: 'II', color: 'amarillo', label: 'Urgencia Relativa (Amarillo)' },
        3: { p: 'III', color: 'verde', label: 'No Urgente (Verde)' },
      }
      const sel = pMap[priority] || pMap[2]

      await createTriaje.mutateAsync({
        atencion_id: selectedAtencionId,
        temperatura_c: parseFloat(temperatura),
        presion_sistolica: parseInt(paSistolica, 10),
        presion_diastolica: parseInt(paDiastolica, 10),
        frecuencia_cardiaca: parseInt(fc, 10),
        frecuencia_respiratoria: parseInt(fr, 10),
        saturacion_o2_pct: parseInt(spo2, 10),
        glucosa_mg_dl: parseInt(glucosa, 10),
        peso_kg: parseFloat(peso),
        talla_cm: Math.round(parseFloat(talla) * 100),
        escala_glasgow: parseInt(glasgow, 10),
        prioridad: sel.p,
        prioridad_color: sel.color,
        prioridad_label: sel.label,
        observaciones_triaje: observaciones.trim() || 'Sin observaciones particulares.',
        sintoma_principal: motivoConsulta || 'Evaluación de constantes vitales en triaje',
      })

      // Imprimir de inmediato el ticket térmico ultra compacto
      if (printSlip) {
        try {
          await printThermalElement('thermal-receipt-printable', '80mm')
        } catch (e) {
          console.warn('[Triaje] Falló printThermalElement:', e)
        }
      }

      setMessage({
        text: `✓ Triaje completado con Prioridad ${sel.p} (${sel.color.toUpperCase()}) registrado correctamente en la base de datos.${printSlip ? ' Ticket clínico impreso con éxito.' : ''}`,
        type: 'success',
      })

      // Limpiar campos de constantes vitales para el siguiente paciente
      setPaSistolica('')
      setPaDiastolica('')
      setFc('')
      setFr('')
      setTemperatura('')
      setSpo2('')
      setGlucosa('')
      setPeso('')
      setTalla('')
      setGlasgow('')
      setObservaciones('')
      setTouchedValidation(false)

      // Pasar automáticamente al siguiente paciente en cola si hay uno en espera
      const nextWaiting = atencionesList.find(
        (a) => a.id !== selectedAtencionId && a.status === 'en_espera_triaje'
      )
      if (nextWaiting) {
        setSelectedAtencionId(nextWaiting.id)
      }
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message
      setMessage({
        text: `Error al registrar triaje: ${apiMsg || 'No se pudo comunicar con el servidor.'}`,
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const paStatus = getPaStatus()
  const fcStatus = getFcStatus()
  const tempStatus = getTempStatus()
  const spo2Status = getSpo2Status()
  const frStatus = getFrStatus()
  const glucosaStatus = getGlucosaStatus()
  const glasgowStatus = getGlasgowStatus()

  const filteredAtenciones = atencionesList.filter((a) => {
    if (!filterQuery.trim()) return true
    const q = filterQuery.toLowerCase()
    const b = a.beneficiario || (a as any)
    const nom = (b?.nombres || '').toLowerCase()
    const ape = (b?.apellidos || '').toLowerCase()
    const dni = (b?.dni || '').toLowerCase()
    const code = (a.ticket_codigo || `T-${a.ticket_number}`).toLowerCase()
    const esp = ((a as any).specialty_name || '').toLowerCase()
    return nom.includes(q) || ape.includes(q) || dni.includes(q) || code.includes(q) || esp.includes(q)
  })

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Barra de Llamado a Triaje por Apellido */}
      <div className="bg-surface p-4 mb-5 border-2 border-primary/50 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span
              className={`material-symbols-outlined text-2xl ${
                llamando ? 'animate-bounce text-primary font-bold' : ''
              }`}
            >
              campaign
            </span>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-secondary font-bold">
              Llamado en Triaje por Apellido (En Sala):
            </div>
            <div className="text-lg md:text-xl font-black uppercase text-on-surface">
              {pacienteApellidos},{' '}
              <span className="font-medium text-sm text-on-surface-variant">{pacienteNombres}</span>
            </div>
            <div className="text-xs text-secondary mt-0.5 font-mono">
              Turno: <strong className="text-primary font-bold">#{ticketCodigo}</strong> • Especialidad: <strong className="text-on-surface font-bold uppercase">{especialidadNombre}</strong> • DNI: {pacienteDni}
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!activeAtencion}
          onClick={() => llamarPorApellido(pacienteApellidos, ticketCodigo, especialidadNombre)}
          className="px-5 py-2.5 bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs cursor-pointer rounded-none whitespace-nowrap transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">volume_up</span>
          <span>{llamando ? 'Llamando por Apellido...' : 'Llamar por Altavoz'}</span>
        </button>
      </div>

      {/* Panel de Pacientes Registrados para Triaje (Lista de Espera) */}
      <div className="bg-surface p-4 mb-5 border border-surface-container-high shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container-high mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="material-symbols-outlined text-[20px] text-primary">groups</span>
            <h2 className="text-sm font-bold tracking-tight text-on-surface uppercase">
              Lista de Espera para Triaje ({atencionesList.length} registrados)
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-primary-container text-on-primary-container font-bold">
              {atencionesList.filter((a) => a.status === 'en_espera_triaje').length} pendientes
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-secondary text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por DNI, apellido o turno..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-surface-container-low text-xs text-on-surface border border-surface-container-high focus:outline-none focus:border-primary placeholder:text-on-surface-variant/40 placeholder:italic"
            />
          </div>
        </div>

        {filteredAtenciones.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[240px] overflow-y-auto p-1">
            {filteredAtenciones.map((atn) => {
              const b = atn.beneficiario || (atn as any)
              const ape = b?.apellidos || 'PACIENTE'
              const nom = b?.nombres || ''
              const doc = b?.dni || '--------'
              const esp = (atn as any).specialty_name || 'Medicina General'
              const code = atn.ticket_codigo || `T-${atn.ticket_number}`
              const isSelected = atn.id === selectedAtencionId
              const isTriaged = atn.status === 'en_espera_medico' || atn.status === 'en_consulta' || atn.status === 'finalizado' || Boolean(atn.prioridad)

              return (
                <div
                  key={atn.id}
                  onClick={() => setSelectedAtencionId(atn.id)}
                  className={`p-2.5 border transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-sm ring-2 ring-primary/40'
                      : isTriaged
                      ? 'bg-surface-container-low/70 border-surface-container-high hover:border-tertiary/40'
                      : 'bg-surface hover:bg-surface-container border-surface-container-high'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.2 ${
                        isSelected
                          ? 'bg-black/30 text-white'
                          : 'bg-surface-container-high text-primary'
                      }`}
                    >
                      #{code}
                    </span>
                    <span
                      className={`text-[9.5px] font-bold px-1.5 py-0.2 uppercase ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : isTriaged
                          ? 'bg-tertiary-container text-on-tertiary-container'
                          : 'bg-amber-500/20 text-amber-700'
                      }`}
                    >
                      {isSelected ? 'EN ATENCIÓN' : isTriaged ? 'Evaluado' : 'Esperando'}
                    </span>
                  </div>

                  <div className={`text-xs font-bold uppercase truncate leading-tight ${isSelected ? 'text-white' : 'text-on-surface'}`}>
                    {ape}, {nom}
                  </div>

                  <div className={`text-[10.5px] truncate font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-on-surface-variant'}`}>
                    DNI: {doc} • {esp}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-on-surface-variant bg-surface-container-low border border-dashed border-surface-container-high">
            {atencionesList.length === 0
              ? 'No hay pacientes registrados en espera de triaje en este momento. A medida que los voluntarios en Acreditación registren personas, aparecerán automáticamente en esta lista.'
              : 'No se encontraron pacientes que coincidan con la búsqueda.'}
          </div>
        )}
      </div>


      {/* Top Patient Context Banner (Cargado dinámicamente al seleccionar el ticket) */}
      <div className="bg-surface shadow-xs border border-surface-container-high mb-6 p-4 md:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-4">
          <div className="w-14 h-14 bg-primary-container text-on-primary-container flex items-center justify-center font-mono font-bold text-xl border border-primary/20">
            {ticketCodigo}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-on-surface uppercase">
                {pacienteApellidos}, {pacienteNombres}
              </h1>
              <span className="bg-surface-container-high text-on-surface-variant text-xs px-2 py-0.5 font-mono">
                DNI: {pacienteDni}
              </span>
              <span className="bg-surface-container-high text-on-surface-variant text-xs px-2 py-0.5">
                {pacienteEdad} • {pacienteSexo === 'F' ? 'Femenino' : 'Masculino'}
              </span>
              <span className="bg-surface-container text-on-surface-variant text-xs px-2 py-0.5 flex items-center gap-1 border border-surface-container-high">
                <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                {pacienteComunidad}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Llegada: {horaLlegada} • Seguro: {pacienteSeguro} • Campaña: {campanaNombre} • {boxNombre}
            </p>
          </div>
        </div>

        {/* Alert Badges & Quick Status */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          {pacienteAlergias && pacienteAlergias.toLowerCase() !== 'ninguna' ? (
            <div className="bg-error-container text-on-error-container px-3.5 py-2 flex items-center gap-2 border border-error/30">
              <span className="material-symbols-outlined text-error text-[20px]">warning</span>
              <span className="text-xs font-bold uppercase tracking-wider">
                Alergia Severa: {pacienteAlergias}
              </span>
            </div>
          ) : (
            <div className="bg-surface-container text-on-surface-variant px-3 py-2 flex items-center gap-2 border border-surface-container-high">
              <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
              <span className="text-xs font-semibold">Sin Alergias Conocidas</span>
            </div>
          )}
          <div className="bg-surface-container px-3 py-2 flex items-center gap-2 text-on-surface border border-surface-container-high">
            <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
            <span className="text-xs font-mono font-semibold">Espera: 12 min</span>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 mb-6 text-xs flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-tertiary-container text-on-tertiary-container border-tertiary/30'
              : message.type === 'error'
              ? 'bg-error-container text-on-error-container border-error/30'
              : 'bg-[#fef3c7] text-[#92400e] border-[#f59e0b]/30'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Formulario de Triaje */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Triage Level Selector (Manchester Modificada Andina) */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Clasificación Manchester Modificada (Andina) *
                </div>
                <h2 className="text-base font-semibold text-on-surface">
                  Nivel de Prioridad de Triaje Clínico
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant flex items-center gap-1 font-mono">
                <span className="material-symbols-outlined text-[16px] text-tertiary">verified_user</span>
                Protocolo MINSA
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Priority I: Red / Emergent */}
              <div
                onClick={() => setPriority(1)}
                className={`cursor-pointer p-4 transition-all relative flex flex-col justify-between border ${
                  priority === 1
                    ? 'bg-surface border-error shadow-sm ring-2 ring-error'
                    : 'bg-surface-container border-surface-container-high hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold tracking-widest text-error uppercase">Prioridad I</span>
                  <span className="material-symbols-outlined text-error text-[22px]">e911_emergency</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-on-surface">Emergencia (Rojo)</div>
                  <div className="text-xs text-on-surface-variant mt-1 leading-snug">
                    Riesgo vital inmediato o inestabilidad severa. Reanimación 0 min.
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-mono text-error font-bold flex items-center justify-between">
                  <span>ATENCIÓN INMEDIATA</span>
                  {priority === 1 && <span className="material-symbols-outlined text-base">check_circle</span>}
                </div>
              </div>

              {/* Priority II: Yellow / Urgent */}
              <div
                onClick={() => setPriority(2)}
                className={`cursor-pointer p-4 transition-all relative flex flex-col justify-between border ${
                  priority === 2
                    ? 'bg-surface border-[#b28600] shadow-sm ring-2 ring-[#b28600]'
                    : 'bg-surface-container border-surface-container-high hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold tracking-widest text-[#b28600] uppercase">Prioridad II</span>
                  <span className="material-symbols-outlined text-[#b28600] text-[22px]">notification_important</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-on-surface">Urgencia Relativa (Amarillo)</div>
                  <div className="text-xs text-on-surface-variant mt-1 leading-snug">
                    Signos alterados con riesgo potencial. Espera máxima &lt; 15 min.
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-mono text-[#b28600] font-bold flex items-center justify-between">
                  <span>SELECCIONADO</span>
                  {priority === 2 && <span className="material-symbols-outlined text-base">check_circle</span>}
                </div>
              </div>

              {/* Priority III: Green / Non-Urgent */}
              <div
                onClick={() => setPriority(3)}
                className={`cursor-pointer p-4 transition-all relative flex flex-col justify-between border ${
                  priority === 3
                    ? 'bg-surface border-tertiary shadow-sm ring-2 ring-tertiary'
                    : 'bg-surface-container border-surface-container-high hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold tracking-widest text-tertiary uppercase">Prioridad III</span>
                  <span className="material-symbols-outlined text-tertiary text-[22px]">health_and_safety</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-on-surface">No Urgente (Verde)</div>
                  <div className="text-xs text-on-surface-variant mt-1 leading-snug">
                    Paciente hemodinámicamente estable. Espera estándar &lt; 60 min.
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-mono text-tertiary font-bold flex items-center justify-between">
                  <span>CONSULTA GENERAL</span>
                  {priority === 3 && <span className="material-symbols-outlined text-base">check_circle</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Vital Signs Grid */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Toma de Signos Fisiológicos
                </div>
                <h2 className="text-base font-semibold text-on-surface">
                  Signos Vitales y Somatometría <span className="text-error font-bold">*</span>
                </h2>
              </div>
              <div className="flex items-center gap-2 bg-surface-container px-2.5 py-1 text-xs font-mono text-on-surface-variant border border-surface-container-high">
                <span>Lectura Bluetooth: Omron HEM-7120</span>
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              </div>
            </div>

            {/* Aviso de Guía / Ejemplos en color tenue */}
            <div className="p-3 mb-5 bg-surface-container border-l-4 border-primary text-xs flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-lg shrink-0">info</span>
              <p className="text-on-surface-variant leading-relaxed">
                <strong className="text-on-surface font-semibold">Campos obligatorios de triaje (*):</strong> Los valores en gris tenue son únicamente <strong className="text-on-surface">ejemplos referenciales</strong> y no se registrarán si se dejan vacíos. Debe ingresar las mediciones reales del paciente.
              </p>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Presión Arterial */}
              <div
                className={`bg-surface-container p-3.5 flex flex-col justify-between border transition-all ${
                  touchedValidation && (!paSistolica.trim() || !paDiastolica.trim())
                    ? 'border-error ring-1 ring-error/50'
                    : 'border-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    PA (Sist / Diast) <span className="text-error">*</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px]">blood_pressure</span>
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    value={paSistolica}
                    onChange={(e) => setPaSistolica(e.target.value)}
                    placeholder="120"
                    title="Presión Sistólica (mmHg). Ejemplo tenue: 120"
                    className="w-14 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high placeholder:text-stone-400 placeholder:italic placeholder:font-normal focus:outline-none focus:border-primary"
                  />
                  <span className="font-bold text-secondary">/</span>
                  <input
                    type="number"
                    value={paDiastolica}
                    onChange={(e) => setPaDiastolica(e.target.value)}
                    placeholder="80"
                    title="Presión Diastólica (mmHg). Ejemplo tenue: 80"
                    className="w-14 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high placeholder:text-stone-400 placeholder:italic placeholder:font-normal focus:outline-none focus:border-primary"
                  />
                  <span className="text-[11px] text-secondary font-mono">mmHg</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 ${paStatus.color}`}>
                  {paStatus.label}
                </span>
              </div>

              {/* Frecuencia Cardíaca */}
              <div
                className={`bg-surface-container p-3.5 flex flex-col justify-between border transition-all ${
                  touchedValidation && !fc.trim() ? 'border-error ring-1 ring-error/50' : 'border-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Frec. Cardíaca <span className="text-error">*</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px]">cardiology</span>
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    value={fc}
                    onChange={(e) => setFc(e.target.value)}
                    placeholder="75"
                    title="Frecuencia Cardíaca (lpm). Ejemplo tenue: 75"
                    className="w-20 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high placeholder:text-stone-400 placeholder:italic placeholder:font-normal focus:outline-none focus:border-primary"
                  />
                  <span className="text-[11px] text-secondary font-mono">lpm</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 ${fcStatus.color}`}>
                  {fcStatus.label}
                </span>
              </div>

              {/* Temperatura */}
              <div
                className={`bg-surface-container p-3.5 flex flex-col justify-between border transition-all ${
                  touchedValidation && !temperatura.trim()
                    ? 'border-error ring-1 ring-error/50'
                    : 'border-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Temperatura <span className="text-error">*</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px]">device_thermostat</span>
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={temperatura}
                    onChange={(e) => setTemperatura(e.target.value)}
                    placeholder="36.5"
                    title="Temperatura (°C). Ejemplo tenue: 36.5"
                    className="w-20 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high placeholder:text-stone-400 placeholder:italic placeholder:font-normal focus:outline-none focus:border-primary"
                  />
                  <span className="text-[11px] text-secondary font-mono">°C</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 ${tempStatus.color}`}>
                  {tempStatus.label}
                </span>
              </div>

              {/* SpO2 Altitudinal */}
              <div
                className={`bg-surface-container p-3.5 flex flex-col justify-between border transition-all ${
                  touchedValidation && !spo2.trim() ? 'border-error ring-1 ring-error/50' : 'border-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    SpO2 (Altitud) <span className="text-error">*</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px]">air</span>
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="95"
                    title="Saturación de Oxígeno (%). Ejemplo tenue: 95"
                    className="w-20 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high placeholder:text-stone-400 placeholder:italic placeholder:font-normal focus:outline-none focus:border-primary"
                  />
                  <span className="text-[11px] text-secondary font-mono">%</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 ${spo2Status.color}`}>
                  {spo2Status.label}
                </span>
              </div>

              {/* Frecuencia Respiratoria */}
              <div
                className={`bg-surface-container p-3.5 flex flex-col justify-between border transition-all ${
                  touchedValidation && !fr.trim() ? 'border-error ring-1 ring-error/50' : 'border-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Frec. Respiratoria <span className="text-error">*</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px]">lungs</span>
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    value={fr}
                    onChange={(e) => setFr(e.target.value)}
                    placeholder="18"
                    title="Frecuencia Respiratoria (rpm). Ejemplo tenue: 18"
                    className="w-20 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high placeholder:text-stone-400 placeholder:italic placeholder:font-normal focus:outline-none focus:border-primary"
                  />
                  <span className="text-[11px] text-secondary font-mono">rpm</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 ${frStatus.color}`}>
                  {frStatus.label}
                </span>
              </div>

              {/* Glucosa */}
              <div
                className={`bg-surface-container p-3.5 flex flex-col justify-between border transition-all ${
                  touchedValidation && !glucosa.trim()
                    ? 'border-error ring-1 ring-error/50'
                    : 'border-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Glucemia Capilar <span className="text-error">*</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px]">water_drop</span>
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    value={glucosa}
                    onChange={(e) => setGlucosa(e.target.value)}
                    placeholder="90"
                    title="Glucemia Capilar (mg/dL). Ejemplo tenue: 90"
                    className="w-20 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high placeholder:text-stone-400 placeholder:italic placeholder:font-normal focus:outline-none focus:border-primary"
                  />
                  <span className="text-[11px] text-secondary font-mono">mg/dL</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 ${glucosaStatus.color}`}>
                  {glucosaStatus.label}
                </span>
              </div>

              {/* Peso & Talla */}
              <div
                className={`bg-surface-container p-3.5 flex flex-col justify-between border transition-all ${
                  touchedValidation && (!peso.trim() || !talla.trim())
                    ? 'border-error ring-1 ring-error/50'
                    : 'border-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Peso / Talla <span className="text-error">*</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px]">monitor_weight</span>
                </div>
                <div className="my-2 flex items-baseline gap-1 text-xs">
                  <input
                    type="number"
                    step="0.5"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    placeholder="68.0"
                    title="Peso en kg. Ejemplo tenue: 68.0"
                    className="w-14 bg-surface font-mono font-bold text-sm px-1 py-0.5 border border-surface-container-high placeholder:text-stone-400 placeholder:italic placeholder:font-normal focus:outline-none focus:border-primary"
                  />
                  <span className="text-[10px] text-secondary">kg /</span>
                  <input
                    type="number"
                    step="0.01"
                    value={talla}
                    onChange={(e) => setTalla(e.target.value)}
                    placeholder="1.62"
                    title="Talla en metros. Ejemplo tenue: 1.62"
                    className="w-14 bg-surface font-mono font-bold text-sm px-1 py-0.5 border border-surface-container-high placeholder:text-stone-400 placeholder:italic placeholder:font-normal focus:outline-none focus:border-primary"
                  />
                  <span className="text-[10px] text-secondary">m</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 bg-surface-container-high text-on-surface">
                  IMC: {imc ? `${imc} kg/m² (${imcCategory})` : 'Pendiente'}
                </span>
              </div>

              {/* Glasgow */}
              <div
                className={`bg-surface-container p-3.5 flex flex-col justify-between border transition-all ${
                  touchedValidation && !glasgow.trim()
                    ? 'border-error ring-1 ring-error/50'
                    : 'border-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Escala Glasgow <span className="text-error">*</span>
                  </span>
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    max={15}
                    min={3}
                    value={glasgow}
                    onChange={(e) => setGlasgow(e.target.value)}
                    placeholder="15"
                    title="Escala de Coma de Glasgow (3-15). Ejemplo tenue: 15"
                    className="w-20 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high placeholder:text-stone-400 placeholder:italic placeholder:font-normal focus:outline-none focus:border-primary"
                  />
                  <span className="text-[11px] text-secondary font-mono">/ 15</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 ${glasgowStatus.color}`}>
                  {glasgowStatus.label}
                </span>
              </div>
            </div>

            {/* Observaciones de Triaje */}
            <div className="mt-4 pt-4 border-t border-surface-container-high">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Hallazgos Físicos &amp; Observaciones de Triaje
              </label>
              <textarea
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Paciente lúcido y orientado en tiempo y espacio, sin signos agudos de alarma, refiere dolor leve en región lumbar de 3 días de evolución..."
                className="w-full p-3 bg-surface-container text-xs text-on-surface border border-surface-container-high placeholder:text-stone-400 placeholder:italic placeholder:font-normal focus:border-primary focus:bg-surface focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="w-full sm:w-auto bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-semibold py-3 px-6 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer rounded-none"
              >
                <span className="material-symbols-outlined text-base">print</span>
                <span>{saving ? 'Registrando e Imprimiendo...' : 'Confirmar Triaje & Imprimir Ticket'}</span>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="w-full sm:w-auto bg-surface hover:bg-surface-container text-on-surface font-semibold py-3 px-5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-surface-container-high cursor-pointer rounded-none"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Guardar Sin Impresión</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="w-full sm:w-auto bg-surface-container hover:bg-surface-container-high text-primary font-semibold py-3 px-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-primary/30 cursor-pointer rounded-none"
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              <span>Vista Previa Ticket</span>
            </button>
          </div>
        </div>

        {/* Right Column: Historical Context & Altitude Guidelines */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Card: Protocolo Altitudinal */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="text-xs uppercase tracking-widest text-primary font-bold font-mono mb-1">
              Guía de Campo MINSA
            </div>
            <h3 className="text-sm font-semibold text-on-surface mb-3">
              Valores Normales SpO2 en Gran Altitud
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2 bg-surface-container border border-surface-container-high">
                <span className="text-on-surface-variant font-medium">Nivel del Mar (0 - 1,000m):</span>
                <span className="font-mono font-bold text-on-surface">95 - 100%</span>
              </div>
              <div className="flex justify-between p-2 bg-surface-container border border-surface-container-high">
                <span className="text-on-surface-variant font-medium">Valle Sagrado (2,800m):</span>
                <span className="font-mono font-bold text-tertiary">90 - 95%</span>
              </div>
              <div className="flex justify-between p-2 bg-surface-container border border-surface-container-high">
                <span className="text-on-surface-variant font-medium">Altiplano Puno (3,800m):</span>
                <span className="font-mono font-bold text-[#b28600]">86 - 92%</span>
              </div>
              <div className="flex justify-between p-2 bg-error-container text-on-error-container border border-error/30">
                <span className="font-semibold">Criterio Oxigenoterapia:</span>
                <span className="font-mono font-bold text-error">&lt; 85%</span>
              </div>
            </div>
          </div>

          {/* Card: Histórico de Consultas del Paciente */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider mb-3">
              Historial de Jornadas Anteriores
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-surface-container border border-surface-container-high text-xs">
                <div className="flex items-center justify-between font-mono text-[11px] text-secondary mb-1">
                  <span>14/MAY/2024</span>
                  <span className="text-tertiary font-bold">CUS-02</span>
                </div>
                <div className="font-semibold text-on-surface">Campaña Urubamba Centro</div>
                <div className="text-[11px] text-on-surface-variant mt-1">
                  PA: 140/90 • Glucemia: 105 • Dx: HTA Grado I • Rx: Enalapril 10mg
                </div>
              </div>

              <div className="p-3 bg-surface-container border border-surface-container-high text-xs">
                <div className="flex items-center justify-between font-mono text-[11px] text-secondary mb-1">
                  <span>02/NOV/2023</span>
                  <span className="text-tertiary font-bold">CUS-01</span>
                </div>
                <div className="font-semibold text-on-surface">Campaña Ollantaytambo</div>
                <div className="text-[11px] text-on-surface-variant mt-1">
                  PA: 130/85 • Dolor osteoarticular • Rx: Ibuprofeno 400mg
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Vista Previa del Ticket Térmico Reducido */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-surface-container-high shadow-2xl max-w-md w-full p-5 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt</span>
                <span className="text-sm font-bold uppercase tracking-wider text-on-surface">
                  Ticket Clínico Reducido (Minimalista)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="overflow-y-auto my-4 p-3 bg-stone-100 flex justify-center">
              {/* Contenedor del Ticket Visualizado (Alta Claridad & Letras Grandes) */}
              <div
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '11px',
                  lineHeight: 1.3,
                  color: '#000000',
                  backgroundColor: '#ffffff',
                  width: '100%',
                  maxWidth: '330px',
                  padding: '12px 14px',
                  border: '2px solid #000000',
                  boxShadow: '0 8px 16px -2px rgba(0, 0, 0, 0.15)',
                }}
              >
                {/* Cabecera con Logotipo Efectivo */}
                <div style={{ textAlign: 'center', borderBottom: '2px dashed #000000', paddingBottom: '6px', marginBottom: '6px' }}>
                  {effectiveLogo ? (
                    <img
                      src={effectiveLogo}
                      alt="Logo Institucional Ticket"
                      style={{ height: '38px', maxWidth: '160px', objectFit: 'contain', margin: '0 auto 4px', display: 'block', filter: 'grayscale(100%) contrast(200%)' }}
                    />
                  ) : (
                    <div style={{ fontSize: '12px', fontWeight: 900, border: '1px solid #000', padding: '2px 6px', display: 'inline-block', margin: '0 auto 4px' }}>
                      [✚ ASISTENCIA MÉDICA]
                    </div>
                  )}
                  <div style={{ fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1.2 }}>
                    {branding.exportHeader || 'ONG SEMILLA • ASISTENCIA MÉDICA RURAL'}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '2px' }}>
                    {branding.exportSubheader || 'SISTEMA DE TRIAJE & EVALUACIÓN CLÍNICA'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#333333', marginTop: '2px' }}>
                    {campanaNombre} • {boxNombre}
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '3px', borderTop: '1px dotted #888888', paddingTop: '2px', fontFamily: 'monospace' }}>
                    EMISIÓN: {new Date().toLocaleDateString('es-PE')} — {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Recuadro de Turno Asignado y Especialidad */}
                <div style={{ border: '2px solid #000000', padding: '6px', textAlign: 'center', marginBottom: '6px', backgroundColor: '#f5f5f5' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ESPECIALIDAD MÉDICA ASIGNADA:
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', color: '#000000', margin: '1px 0' }}>
                    {especialidadNombre}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#444444' }}>
                    {medicoAsignado}
                  </div>

                  <div style={{ borderTop: '1px dashed #000000', margin: '4px 0', paddingTop: '2px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>TURNO DE ATENCIÓN</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1.1, margin: '2px 0', fontFamily: 'monospace', letterSpacing: '1px' }}>
                      #{ticketCodigo}
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', backgroundColor: '#000000', color: '#ffffff', padding: '2px 6px', display: 'inline-block', marginTop: '2px' }}>
                    {priority === 1
                      ? 'PRIORIDAD I: EMERGENCIA (ROJO)'
                      : priority === 2
                      ? 'PRIORIDAD II: URGENCIA (AMARILLO)'
                      : 'PRIORIDAD III: NO URGENTE (VERDE)'}
                  </div>
                  <div style={{ fontSize: '9.5px', marginTop: '3px', fontWeight: 'bold' }}>
                    {priority === 1 ? 'Atención Médica Inmediata (0 min)' : priority === 2 ? 'Espera máxima estimada < 15 min' : 'Espera estándar en sala < 60 min'}
                  </div>
                </div>

                {/* Filiación Completa del Paciente (Letras Grandes y Claras) */}
                <div style={{ borderBottom: '2px dashed #000000', paddingBottom: '5px', marginBottom: '6px', fontSize: '11px' }}>
                  <div style={{ fontWeight: 900, fontSize: '12.5px', textTransform: 'uppercase', lineHeight: 1.25, marginBottom: '3px' }}>
                    PACIENTE: {pacienteApellidos}, {pacienteNombres}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span><strong>DNI:</strong> {pacienteDni}</span>
                    <span><strong>EDAD:</strong> {pacienteEdad}</span>
                    <span><strong>SEXO:</strong> {pacienteSexo}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span><strong>SEGURO:</strong> {pacienteSeguro}</span>
                    <span><strong>LLEGADA:</strong> {horaLlegada}</span>
                  </div>
                  <div>
                    <strong>COMUNIDAD:</strong> {pacienteComunidad}
                  </div>

                  {pacienteAlergias && pacienteAlergias.toLowerCase() !== 'ninguna' && (
                    <div style={{ border: '2px solid #000000', padding: '3px 4px', marginTop: '4px', textAlign: 'center', fontWeight: 900, fontSize: '10.5px', backgroundColor: '#f0f0f0' }}>
                      ⚠️ ALERTA: ALERGIA SEVERA A {pacienteAlergias.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Constantes Clínicas en Rejilla Clara y Ordenada */}
                <div style={{ borderBottom: '2px dashed #000000', paddingBottom: '6px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    CONSTANTES VITALES DE TRIAJE:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px', fontSize: '11px', lineHeight: 1.35 }}>
                    <div><strong>PA:</strong> {paSistolica || '—'}/{paDiastolica || '—'} mmHg</div>
                    <div><strong>FC:</strong> {fc || '—'} lpm</div>
                    <div><strong>FR:</strong> {fr || '—'} rpm</div>
                    <div><strong>T°:</strong> {temperatura || '—'} °C</div>
                    <div><strong>SpO2:</strong> {spo2 || '—'}% (Altitud)</div>
                    <div><strong>Glucosa:</strong> {glucosa || '—'} mg/dL</div>
                    <div><strong>Peso:</strong> {peso || '—'} kg</div>
                    <div><strong>Talla:</strong> {talla || '—'} m</div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <strong>IMC:</strong> {imc ? `${imc} kg/m² (${imcCategory})` : '—'}
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <strong>Escala Glasgow:</strong> {glasgow ? `${glasgow}/15` : '—'}
                    </div>
                  </div>
                  {observaciones && (
                    <div style={{ fontSize: '10px', marginTop: '4px', borderTop: '1px dotted #888888', paddingTop: '3px', fontStyle: 'italic' }}>
                      <strong>Observaciones:</strong> {observaciones}
                    </div>
                  )}
                </div>

                {/* Destino y Consultorio */}
                <div style={{ border: '1px solid #000000', padding: '4px 6px', textAlign: 'center', marginBottom: '6px', fontSize: '11px', backgroundColor: '#fafafa' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 'bold', textTransform: 'uppercase' }}>DESTINO CLÍNICO ASIGNADO:</div>
                  <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', margin: '2px 0' }}>
                    {especialidadNombre} — {consultorioDestino}
                  </div>
                  <div style={{ fontSize: '10px', color: '#333333' }}>Médico Responsable: {medicoAsignado}</div>
                </div>

                {/* Código QR Clínico Compacto */}
                {qrCodeUrl && (
                  <div style={{ textAlign: 'center', margin: '4px 0' }}>
                    <img src={qrCodeUrl} alt="QR Triaje" style={{ width: '80px', height: '80px', margin: '0 auto', display: 'block' }} />
                    <div style={{ fontSize: '8.5px', color: '#444444', marginTop: '2px', fontFamily: 'monospace' }}>
                      Código de Verificación Clínica P2P
                    </div>
                  </div>
                )}

                {/* Pie Legal y Firmas */}
                <div style={{ borderTop: '1px solid #000000', paddingTop: '4px', marginTop: '4px' }}>
                  <div style={{ fontSize: '9.5px', textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1.25, marginBottom: '6px' }}>
                    {branding.exportFooterLegal || 'Conserve este ticket para ser llamado por altavoz a su consulta médica.'}
                  </div>
                  <div style={{ fontSize: '9px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dotted #888888', paddingTop: '3px' }}>
                    <div>
                      <div>Lic. Triaje: Enfermería</div>
                      <div style={{ color: '#555555' }}>Red Semilla Rural</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div>Firma / Sello: _____________</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-xs font-semibold uppercase text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => printThermalElement('thermal-receipt-printable', '80mm')}
                className="px-4 py-2 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Imprimir Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Térmico Oculto para Spooler e Impresión Directa en Rollos 58mm / 80mm */}
      <div id="thermal-receipt-printable" className="hidden">
        <div
          style={{
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '11px',
            lineHeight: 1.3,
            color: '#000000',
            backgroundColor: '#ffffff',
            width: '100%',
            maxWidth: '72mm',
            margin: '0 auto',
            padding: '2mm 1mm',
            boxSizing: 'border-box',
          }}
        >
          {/* Cabecera con Logotipo Efectivo */}
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #000000', paddingBottom: '4px', marginBottom: '4px' }}>
            {effectiveLogo ? (
              <img
                src={effectiveLogo}
                alt="Logo Ticket"
                style={{ height: '36px', maxWidth: '150px', objectFit: 'contain', margin: '0 auto 2px', display: 'block', filter: 'grayscale(100%) contrast(200%)' }}
              />
            ) : (
              <div style={{ fontSize: '12px', fontWeight: 900, border: '1px solid #000', padding: '2px 4px', display: 'inline-block', margin: '0 auto 2px' }}>
                [✚ ASISTENCIA MÉDICA]
              </div>
            )}
            <div style={{ fontWeight: 900, fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1.2 }}>
              {branding.exportHeader || 'ONG SEMILLA - ASISTENCIA MEDICA'}
            </div>
            <div style={{ fontSize: '10.5px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '1px' }}>
              {branding.exportSubheader || 'TRIAJE Y CONSTANTES VITALES'}
            </div>
            <div style={{ fontSize: '9.5px', color: '#333333', marginTop: '1px' }}>
              {campanaNombre} • {boxNombre}
            </div>
            <div style={{ fontSize: '9px', marginTop: '2px', borderTop: '1px dotted #888888', paddingTop: '2px', fontFamily: 'monospace' }}>
              EMISIÓN: {new Date().toLocaleDateString('es-PE')} — {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Turno y Especialidad */}
          <div style={{ border: '2px solid #000000', padding: '5px', textAlign: 'center', marginBottom: '5px', backgroundColor: '#f5f5f5' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 'bold', textTransform: 'uppercase' }}>ESPECIALIDAD MÉDICA:</div>
            <div style={{ fontSize: '12.5px', fontWeight: 900, textTransform: 'uppercase', margin: '1px 0' }}>
              {especialidadNombre}
            </div>
            <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#333333' }}>
              {medicoAsignado}
            </div>

            <div style={{ borderTop: '1px dashed #000000', margin: '3px 0', paddingTop: '2px' }}>
              <div style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px' }}>CÓDIGO DE TURNO</div>
              <div style={{ fontSize: '26px', fontWeight: 900, lineHeight: 1.1, margin: '2px 0', fontFamily: 'monospace' }}>
                #{ticketCodigo}
              </div>
            </div>

            <div style={{ fontSize: '10.5px', fontWeight: 900, textTransform: 'uppercase', backgroundColor: '#000000', color: '#ffffff', padding: '2px 4px', display: 'inline-block', marginTop: '2px' }}>
              {priority === 1
                ? 'PRIORIDAD I: EMERGENCIA (ROJO)'
                : priority === 2
                ? 'PRIORIDAD II: URGENCIA (AMARILLO)'
                : 'PRIORIDAD III: NO URGENTE (VERDE)'}
            </div>
            <div style={{ fontSize: '9px', marginTop: '2px', fontWeight: 'bold' }}>
              {priority === 1 ? 'Atención Inmediata (0 min)' : priority === 2 ? 'Espera máxima estimada < 15 min' : 'Espera estándar < 60 min'}
            </div>
          </div>

          {/* Filiación Completa del Paciente */}
          <div style={{ borderBottom: '2px dashed #000000', paddingBottom: '4px', marginBottom: '4px', fontSize: '10.5px' }}>
            <div style={{ fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', lineHeight: 1.2 }}>
              PACIENTE: {pacienteApellidos}, {pacienteNombres}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
              <span><strong>DNI:</strong> {pacienteDni}</span>
              <span><strong>EDAD:</strong> {pacienteEdad}</span>
              <span><strong>SEXO:</strong> {pacienteSexo}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
              <span><strong>SEGURO:</strong> {pacienteSeguro}</span>
              <span><strong>LLEGADA:</strong> {horaLlegada}</span>
            </div>
            <div style={{ marginTop: '1px' }}>
              <strong>COMUNIDAD:</strong> {pacienteComunidad}
            </div>

            {pacienteAlergias && pacienteAlergias.toLowerCase() !== 'ninguna' && (
              <div style={{ border: '2px solid #000000', padding: '2px 4px', marginTop: '3px', textAlign: 'center', fontWeight: 900, fontSize: '10px', backgroundColor: '#eeeeee' }}>
                ⚠️ ALERTA: ALERGIA SEVERA A {pacienteAlergias.toUpperCase()}
              </div>
            )}
          </div>

          {/* Constantes Clínicas */}
          <div style={{ borderBottom: '2px dashed #000000', paddingBottom: '4px', marginBottom: '4px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
              CONSTANTES VITALES DE TRIAJE:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 6px', fontSize: '10.5px', lineHeight: 1.3 }}>
              <div><strong>PA:</strong> {paSistolica || '—'}/{paDiastolica || '—'} mmHg</div>
              <div><strong>FC:</strong> {fc || '—'} lpm</div>
              <div><strong>FR:</strong> {fr || '—'} rpm</div>
              <div><strong>T°:</strong> {temperatura || '—'} °C</div>
              <div><strong>SpO2:</strong> {spo2 || '—'}%</div>
              <div><strong>Glucosa:</strong> {glucosa || '—'} mg/dL</div>
              <div><strong>Peso:</strong> {peso || '—'} kg</div>
              <div><strong>Talla:</strong> {talla || '—'} m</div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>IMC:</strong> {imc ? `${imc} kg/m² (${imcCategory})` : '—'}
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Escala Glasgow:</strong> {glasgow ? `${glasgow}/15` : '—'}
              </div>
            </div>
            {observaciones && (
              <div style={{ fontSize: '9.5px', marginTop: '3px', borderTop: '1px dotted #888888', paddingTop: '2px', fontStyle: 'italic' }}>
                <strong>Obs:</strong> {observaciones}
              </div>
            )}
          </div>

          {/* Destino Clínico Asignado */}
          <div style={{ border: '1px solid #000000', padding: '3px 5px', textAlign: 'center', marginBottom: '4px', fontSize: '10.5px', backgroundColor: '#fafafa' }}>
            <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>DESTINO CLÍNICO ASIGNADO:</div>
            <div style={{ fontSize: '11.5px', fontWeight: 900, textTransform: 'uppercase', margin: '1px 0' }}>
              {especialidadNombre} — {consultorioDestino}
            </div>
            <div style={{ fontSize: '9.5px', color: '#333333' }}>Médico: {medicoAsignado}</div>
          </div>

          {/* Código QR Clínico Compacto */}
          {qrCodeUrl && (
            <div style={{ textAlign: 'center', margin: '3px 0' }}>
              <img src={qrCodeUrl} alt="QR Triaje" style={{ width: '75px', height: '75px', margin: '0 auto', display: 'block' }} />
              <div style={{ fontSize: '8px', color: '#444444', marginTop: '1px', fontFamily: 'monospace' }}>
                Código de Verificación Clínica P2P
              </div>
            </div>
          )}

          {/* Pie Legal y Firmas */}
          <div style={{ borderTop: '1px solid #000000', paddingTop: '3px', marginTop: '3px' }}>
            <div style={{ fontSize: '9px', textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1.25, marginBottom: '4px' }}>
              {branding.exportFooterLegal || 'Conserve este ticket para ser llamado por altavoz a su consulta médica.'}
            </div>
            <div style={{ fontSize: '8.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dotted #888888', paddingTop: '2px' }}>
              <div>
                <div>Lic. Triaje: Enfermería</div>
                <div style={{ color: '#555555' }}>Red Semilla Rural</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>Firma / Sello: _____________</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

