import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  useAtenciones,
  useMedicos,
  useMedicamentos,
  useStoreConsulta,
} from '../../api/hooks'
import { useAuthStore } from '../../store/authStore'
import { useBrandingStore, getEffectiveTicketLogo } from '../../store/brandingStore'
import { printThermalElement } from '../../utils/printEngine'

interface DiagnosticoItem {
  cie10: string
  descripcion: string
  tipo: 'definitivo' | 'presuntivo' | 'repetido'
}

interface RecetaItem {
  medicamento_id?: number
  nombre: string
  forma: string
  dosis: string
  frecuencia: string
  duracion: string
  via: string
  cantidad: number | string
  indicaciones: string
}

const FREQUENT_DIAGNOSTICS = [
  { cie10: 'M54.5', descripcion: 'Lumbago no especificado / Lumbalgia mecánica' },
  { cie10: 'I10', descripcion: 'Hipertensión esencial (primaria)' },
  { cie10: 'J00', descripcion: 'Rinofaringitis aguda (resfriado común)' },
  { cie10: 'K29.7', descripcion: 'Gastritis, no especificada' },
  { cie10: 'J02.9', descripcion: 'Faringitis aguda, no especificada' },
  { cie10: 'M17.9', descripcion: 'Gonartrosis, no especificada (artrosis de rodilla)' },
  { cie10: 'D50.9', descripcion: 'Anemia por deficiencia de hierro, sin especificación' },
  { cie10: 'B82.9', descripcion: 'Parasitosis intestinal, sin especificación' },
]

export default function ConsultaPage() {
  const [searchParams] = useSearchParams()
  const atencionIdFromParam = searchParams.get('atencion_id') ? Number(searchParams.get('atencion_id')) : null

  const currentUser = useAuthStore((s) => s.user)
  const branding = useBrandingStore()
  const effectiveLogo = getEffectiveTicketLogo(branding)

  const isAdmin = currentUser?.role === 'admin'
  const isMedico = currentUser?.role === 'medico'

  // Catálogo de Médicos para el selector del Administrador
  const { data: medicosList = [] } = useMedicos()

  // Estado del médico seleccionado:
  // Si es médico, fijado a su ID. Si es admin, puede elegir 'all' o un médico específico.
  const [selectedMedicoId, setSelectedMedicoId] = useState<string>(
    isMedico && currentUser?.id ? String(currentUser.id) : 'all'
  )

  useEffect(() => {
    if (isMedico && currentUser?.id) {
      setSelectedMedicoId(String(currentUser.id))
    }
  }, [isMedico, currentUser?.id])

  // Carga de Atenciones activas
  const { data: atencionesData, refetch: refetchAtenciones } = useAtenciones({ per_page: 200 })
  const allAtenciones: any[] = Array.isArray(atencionesData)
    ? atencionesData
    : (Array.isArray(atencionesData?.data) ? atencionesData.data : [])

  // Filtrado según el rol y el selector de médicos:
  // Médicos ven solo sus pacientes asignados o de su especialidad
  // Admins ven todos o filtran por el médico seleccionado en el dropdown
  const filteredByDoctorAtenciones = allAtenciones.filter((a) => {
    if (selectedMedicoId === 'all') return true
    const docId = Number(selectedMedicoId)
    return Number(a.medico_id) === docId
  })

  // Pacientes en cola médica o en atención
  const medicalWaitingAtenciones = filteredByDoctorAtenciones.filter(
    (a) => a.status === 'en_espera_medico' || a.status === 'en_consulta' || a.status === 'finalizado'
  )

  const [selectedAtencionId, setSelectedAtencionId] = useState<number | null>(atencionIdFromParam)
  const [filterQuery, setFilterQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'clinica' | 'receta' | 'indicaciones' | 'ticket'>('clinica')

  // Auto-seleccionar el primer paciente en espera de consulta médica si no hay uno seleccionado
  useEffect(() => {
    if (atencionIdFromParam) {
      setSelectedAtencionId(atencionIdFromParam)
    } else if (medicalWaitingAtenciones.length > 0) {
      if (!selectedAtencionId || !medicalWaitingAtenciones.some((a) => a.id === selectedAtencionId)) {
        const firstWaiting = medicalWaitingAtenciones.find((a) => a.status === 'en_espera_medico' || a.status === 'en_consulta')
        setSelectedAtencionId(firstWaiting ? firstWaiting.id : medicalWaitingAtenciones[0].id)
      }
    }
  }, [atencionIdFromParam, medicalWaitingAtenciones, selectedAtencionId])

  const activeAtencion = medicalWaitingAtenciones.find((a) => a.id === selectedAtencionId) || (medicalWaitingAtenciones[0] ?? null)

  // Datos del paciente activo
  const rawBene = activeAtencion?.beneficiario || (activeAtencion as any)
  const pacienteApellidos = activeAtencion?.apellidos || rawBene?.apellidos || 'PACIENTE'
  const pacienteNombres = activeAtencion?.nombres || rawBene?.nombres || 'EN ESPERA'
  const pacienteDni = activeAtencion?.dni || rawBene?.dni || '--------'
  const pacienteEdad = activeAtencion?.edad_calculada
    ? `${activeAtencion.edad_calculada} años`
    : (rawBene?.edad_calculada ? `${rawBene.edad_calculada} años` : 'Edad no reg.')
  const pacienteSexo = activeAtencion?.sexo || rawBene?.sexo || 'M'
  const pacienteComunidad = activeAtencion?.comunidad || rawBene?.comunidad || 'Comunidad General'
  const pacienteSeguro = activeAtencion?.tipo_seguro || rawBene?.tipo_seguro || activeAtencion?.seguro_usado || 'SIS Activo'
  const ticketCodigo = activeAtencion?.ticket_codigo || (activeAtencion ? `T-${activeAtencion.ticket_number}` : '---')
  const especialidadNombre = activeAtencion?.specialty_name || 'Medicina General'
  const consultorioNombre = activeAtencion?.consultorio || 'Consultorio 01'

  // Alergias del paciente
  const pacienteAlergias =
    rawBene?.alergias ||
    (rawBene?.alergias_activas
      ? Array.isArray(rawBene.alergias_activas)
        ? rawBene.alergias_activas.join(', ')
        : String(rawBene.alergias_activas)
      : null)

  // Signos vitales tomados en Triaje
  const vitalsPa = activeAtencion?.presion_sistolica && activeAtencion?.presion_diastolica
    ? `${activeAtencion.presion_sistolica}/${activeAtencion.presion_diastolica}`
    : '---'
  const vitalsFc = activeAtencion?.frecuencia_cardiaca ? `${activeAtencion.frecuencia_cardiaca} lpm` : '---'
  const vitalsFr = activeAtencion?.frecuencia_respiratoria ? `${activeAtencion.frecuencia_respiratoria} rpm` : '---'
  const vitalsTemp = activeAtencion?.temperatura_c ? `${activeAtencion.temperatura_c} °C` : '---'
  const vitalsSpo2 = activeAtencion?.saturacion_o2_pct ? `${activeAtencion.saturacion_o2_pct}%` : '---'
  const vitalsGlucosa = activeAtencion?.glucosa_mg_dl ? `${activeAtencion.glucosa_mg_dl} mg/dL` : '---'
  const vitalsPeso = activeAtencion?.peso_kg || activeAtencion?.triaje_peso ? `${activeAtencion.peso_kg || activeAtencion.triaje_peso} kg` : '---'
  const vitalsTalla = activeAtencion?.talla_cm || activeAtencion?.triaje_talla ? `${activeAtencion.talla_cm || activeAtencion.triaje_talla} cm` : '---'
  const vitalsImc = activeAtencion?.imc || activeAtencion?.triaje_imc ? `${activeAtencion.imc || activeAtencion.triaje_imc}` : '---'
  const vitalsPrioridad = activeAtencion?.prioridad || 'III'
  const vitalsColor = activeAtencion?.prioridad_color || 'verde'
  const motivoConsultaTriaje = activeAtencion?.notes || activeAtencion?.sintoma_principal || 'Evaluación médica general en carpa de campaña.'

  // Médico asignado para la receta y sello
  const currentDoctorName = isMedico
    ? `Dr. ${currentUser?.full_name || `${currentUser?.nombres || ''} ${currentUser?.apellidos || ''}`.trim()}`
    : (activeAtencion?.medico_asignado_nombre ||
       (medicosList.find((m) => String(m.id) === selectedMedicoId)
         ? `Dr. ${medicosList.find((m) => String(m.id) === selectedMedicoId)?.name} ${medicosList.find((m) => String(m.id) === selectedMedicoId)?.apellidos}`
         : 'Dr. Marco Huaman Quispe'))

  const currentDoctorCmp = isMedico
    ? (currentUser?.cmp_code || 'CMP-89241')
    : (medicosList.find((m) => String(m.id) === selectedMedicoId)?.cmp_code || 'CMP-89241')

  // Catálogo de medicamentos desde backend
  const { data: medicamentosList = [] } = useMedicamentos()

  // Formulario Clínico de la Consulta
  const [enfermedadActual, setEnfermedadActual] = useState('')
  const [examenFisico, setExamenFisico] = useState('')
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoItem[]>([])
  const [nuevoCie, setNuevoCie] = useState('')
  const [nuevoDesc, setNuevoDesc] = useState('')
  const [tipoDx, setTipoDx] = useState<'definitivo' | 'presuntivo' | 'repetido'>('definitivo')

  // Formulario de Receta Médica & Posología
  const [recetas, setRecetas] = useState<RecetaItem[]>([])
  const [selectedMedId, setSelectedMedId] = useState<string>('')
  const [nombreMedCustom, setNombreMedCustom] = useState('')
  const [formaFarmaceutica, setFormaFarmaceutica] = useState('Tableta')
  const [dosisInput, setDosisInput] = useState('1 tableta')
  const [frecuenciaInput, setFrecuenciaInput] = useState('Cada 8 horas')
  const [duracionInput, setDuracionInput] = useState('3 días')
  const [viaInput, setViaInput] = useState('Oral')
  const [cantidadInput, setCantidadInput] = useState<string>('10')
  const [indicacionesInput, setIndicacionesInput] = useState('Tomar con abundante agua después de los alimentos.')

  // Plan de Tratamiento e Indicaciones Generales
  const [planTratamiento, setPlanTratamiento] = useState('Tratamiento ambulatorio farmacológico y control de síntomas.')
  const [indicacionesGenerales, setIndicacionesGenerales] = useState('Reposo relativo. Buena hidratación oral. Acudir inmediatamente a posta si presenta signos de alarma.')

  // Estado de guardado y feedback
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [qrRecetaDataUrl, setQrRecetaDataUrl] = useState<string>('')

  // Mutación para guardar consulta
  const createConsulta = useStoreConsulta()

  // Cargar datos por defecto al cambiar de paciente activo
  useEffect(() => {
    if (activeAtencion) {
      setEnfermedadActual(
        `Paciente acude a consulta médica por ${activeAtencion.sintoma_principal || activeAtencion.notes || 'malestar general'}. Refiere sintomatología de evolución reciente.`
      )
      setExamenFisico(
        `Paciente en BEG, BEH, LOTEP. Tórax: Murmullo vesicular pasa simétrico bilateral. CV: Ruidos rítmicos normofonéticos. Abdomen: Blando, depresible, no visceromegalia.`
      )
      setDiagnosticos([
        {
          cie10: activeAtencion.specialty_code === 'GIN' ? 'N76.0' : activeAtencion.specialty_code === 'PED' ? 'J00' : 'M54.5',
          descripcion: activeAtencion.specialty_code === 'GIN' ? 'Vaginitis aguda' : activeAtencion.specialty_code === 'PED' ? 'Rinofaringitis aguda' : 'Lumbago no especificado / Dolor osteomuscular',
          tipo: 'definitivo',
        },
      ])
      setRecetas([
        {
          nombre: 'Paracetamol 500 mg',
          forma: 'Tableta',
          dosis: '1 tableta',
          frecuencia: 'Cada 8 horas',
          duracion: '3 días',
          via: 'Oral',
          cantidad: 10,
          indicaciones: 'Tomar con abundante agua después de los alimentos.',
        },
      ])
    }
  }, [activeAtencion?.id])

  // Generar código QR para la receta térmica
  useEffect(() => {
    if (activeAtencion) {
      const qrData = JSON.stringify({
        sistema: 'SEMILLA-TRIAJE',
        tipo: 'RECETA_MEDICA',
        ticket: ticketCodigo,
        paciente: `${pacienteApellidos}, ${pacienteNombres}`,
        dni: pacienteDni,
        medico: currentDoctorName,
        cmp: currentDoctorCmp,
        fecha: new Date().toISOString().slice(0, 10),
      })
      QRCode.toDataURL(qrData, { width: 140, margin: 1 })
        .then((url) => setQrRecetaDataUrl(url))
        .catch(() => {})
    }
  }, [activeAtencion?.id, ticketCodigo, currentDoctorName, currentDoctorCmp, pacienteDni])

  // Al elegir un medicamento del catálogo
  const handleSelectMedicamento = (medId: string) => {
    setSelectedMedId(medId)
    if (!medId) return
    const found = medicamentosList.find((m) => String(m.id) === medId)
    if (found) {
      const nomCompleto = `${found.nombre_generico} ${found.concentracion || ''}`.trim()
      setNombreMedCustom(nomCompleto)
      setFormaFarmaceutica(found.forma_farmaceutica ? found.forma_farmaceutica.charAt(0).toUpperCase() + found.forma_farmaceutica.slice(1) : 'Tableta')
      setViaInput(found.via_administracion ? found.via_administracion.charAt(0).toUpperCase() + found.via_administracion.slice(1) : 'Oral')
      if (found.forma_farmaceutica?.toLowerCase().includes('jarabe')) {
        setDosisInput('5 mL a 7.5 mL')
        setCantidadInput('1')
        setFormaFarmaceutica('Frasco Jarabe')
      } else {
        setDosisInput('1 tableta')
        setCantidadInput('10')
      }
    }
  }

  // Agregar diagnóstico
  const handleAddDiagnostico = () => {
    if (!nuevoCie.trim() || !nuevoDesc.trim()) return
    setDiagnosticos([
      ...diagnosticos,
      { cie10: nuevoCie.trim().toUpperCase(), descripcion: nuevoDesc.trim(), tipo: tipoDx },
    ])
    setNuevoCie('')
    setNuevoDesc('')
  }

  const handleSelectFrequentDx = (dx: { cie10: string; descripcion: string }) => {
    if (!diagnosticos.some((d) => d.cie10 === dx.cie10)) {
      setDiagnosticos([...diagnosticos, { cie10: dx.cie10, descripcion: dx.descripcion, tipo: 'definitivo' }])
    }
  }

  const handleRemoveDiagnostico = (index: number) => {
    setDiagnosticos(diagnosticos.filter((_, i) => i !== index))
  }

  // Agregar medicamento a la receta
  const handleAddReceta = () => {
    const medName = nombreMedCustom.trim()
    if (!medName) {
      setMessage({ text: 'Por favor ingrese o seleccione el nombre del medicamento.', type: 'error' })
      return
    }
    const item: RecetaItem = {
      medicamento_id: selectedMedId ? Number(selectedMedId) : undefined,
      nombre: medName,
      forma: formaFarmaceutica.trim() || 'Tableta',
      dosis: dosisInput.trim() || '1 tableta',
      frecuencia: frecuenciaInput.trim() || 'Cada 8 horas',
      duracion: duracionInput.trim() || '3 días',
      via: viaInput.trim() || 'Oral',
      cantidad: cantidadInput || 1,
      indicaciones: indicacionesInput.trim() || 'Tomar después de los alimentos con abundante agua.',
    }

    setRecetas([...recetas, item])
    setNombreMedCustom('')
    setSelectedMedId('')
    setIndicacionesInput('Tomar con abundante agua después de los alimentos.')
  }

  const handleRemoveReceta = (index: number) => {
    setRecetas(recetas.filter((_, i) => i !== index))
  }

  // Imprimir Ticket Térmico de Receta
  const handlePrintReceta = async () => {
    try {
      await printThermalElement('receta-thermal-printable', '80mm')
    } catch (e) {
      console.warn('[Consulta] Falló printThermalElement:', e)
    }
  }

  // Guardar avance clínico como borrador (mantener paciente En Consulta sin finalizar ni imprimir)
  const handleSaveDraft = async () => {
    if (!activeAtencion) {
      setMessage({ text: 'No hay paciente seleccionado para atender.', type: 'error' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const docId = isMedico && currentUser?.id
        ? currentUser.id
        : (selectedMedicoId !== 'all' ? Number(selectedMedicoId) : (activeAtencion.medico_id || 2))

      await createConsulta.mutateAsync({
        atencion_id: activeAtencion.id,
        medico_id: docId,
        motivo_consulta: motivoConsultaTriaje,
        enfermedad_actual: enfermedadActual,
        examen_fisico: examenFisico,
        diagnosticos: diagnosticos.map((d) => ({
          cie10: d.cie10,
          descripcion: d.descripcion,
          tipo: d.tipo,
        })),
        plan_tratamiento: planTratamiento,
        indicaciones: indicacionesGenerales,
        receta: recetas.map((r, idx) => ({
          medicamento_id: r.medicamento_id || idx + 1,
          nombre: r.nombre,
          forma: r.forma,
          dosis: `${r.dosis} ${r.frecuencia}`,
          duracion: r.duracion,
          cantidad: r.cantidad,
          indicaciones: `${r.indicaciones} (Vía ${r.via})`,
        })),
        finalizar: false,
      })

      setMessage({
        text: `✓ Consulta guardada como avance para ${pacienteApellidos}, ${pacienteNombres}. El paciente permanece 'En Consulta'.`,
        type: 'success',
      })

      await refetchAtenciones()
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message
      setMessage({ text: `Error al guardar consulta: ${apiMsg || 'Error de conexión.'}`, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Finalizar Consulta Médica, Guardar como Finalizado y Emitir/Imprimir Receta
  const handleFinalizeAndPrint = async () => {
    if (!activeAtencion) {
      setMessage({ text: 'No hay paciente seleccionado para atender.', type: 'error' })
      return
    }
    if (diagnosticos.length === 0) {
      setMessage({ text: 'Debe ingresar al menos un diagnóstico CIE-10 antes de finalizar la consulta.', type: 'error' })
      return
    }
    if (recetas.length === 0) {
      setMessage({ text: 'Debe prescribir al menos un medicamento en la receta para finalizar e imprimir.', type: 'error' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const docId = isMedico && currentUser?.id
        ? currentUser.id
        : (selectedMedicoId !== 'all' ? Number(selectedMedicoId) : (activeAtencion.medico_id || 2))

      await createConsulta.mutateAsync({
        atencion_id: activeAtencion.id,
        medico_id: docId,
        motivo_consulta: motivoConsultaTriaje,
        enfermedad_actual: enfermedadActual,
        examen_fisico: examenFisico,
        diagnosticos: diagnosticos.map((d) => ({
          cie10: d.cie10,
          descripcion: d.descripcion,
          tipo: d.tipo,
        })),
        plan_tratamiento: planTratamiento,
        indicaciones: indicacionesGenerales,
        receta: recetas.map((r, idx) => ({
          medicamento_id: r.medicamento_id || idx + 1,
          nombre: r.nombre,
          forma: r.forma,
          dosis: `${r.dosis} ${r.frecuencia}`,
          duracion: r.duracion,
          cantidad: r.cantidad,
          indicaciones: `${r.indicaciones} (Vía ${r.via})`,
        })),
        finalizar: true,
        signed_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })

      setMessage({
        text: `✓ ¡Consulta médica finalizada con éxito para ${pacienteApellidos}, ${pacienteNombres}! Estado cambiado a 'Finalizado' y receta emitida.`,
        type: 'success',
      })

      setTimeout(() => {
        handlePrintReceta()
      }, 350)

      await refetchAtenciones()
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message
      setMessage({ text: `Error al finalizar consulta: ${apiMsg || 'Error de conexión.'}`, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Filtrado de la lista de pacientes
  const displayPatients = medicalWaitingAtenciones.filter((a) => {
    if (!filterQuery.trim()) return true
    const q = filterQuery.toLowerCase()
    const nom = (a.nombres || '').toLowerCase()
    const ape = (a.apellidos || '').toLowerCase()
    const dni = (a.dni || '').toLowerCase()
    const tkt = (a.ticket_codigo || `T-${a.ticket_number}`).toLowerCase()
    return nom.includes(q) || ape.includes(q) || dni.includes(q) || tkt.includes(q)
  })

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* ── BARRA SUPERIOR: CONTEXTO MÉDICO & SELECTOR PARA EL ADMINISTRADOR ── */}
      <div className="bg-surface border-b border-surface-container-high p-4 mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-xl">stethoscope</span>
            <h1 className="text-base font-black tracking-tight uppercase text-on-surface">
              Módulo de Consulta Médica & Prescripción
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-primary-container text-on-primary-container font-bold uppercase">
              {isMedico ? 'Modo Médico Tratante' : 'Auditoría Clínica Admin'}
            </span>
          </div>
          <div className="text-xs text-on-surface-variant">
            {isMedico
              ? `Sesión activa: ${currentDoctorName} • CMP: ${currentDoctorCmp} (Viendo solo sus pacientes asignados)`
              : 'Vista de Administrador: Monitoreo general de atenciones y auditoría por médico tratante.'}
          </div>
        </div>

        {/* SELECTOR DE MÉDICOS EXCLUSIVO PARA ADMINISTRADOR */}
        {isAdmin && (
          <div className="flex items-center gap-2 bg-surface-container-low p-2 border border-surface-container-high w-full md:w-auto">
            <span className="material-symbols-outlined text-secondary text-sm">filter_alt</span>
            <label className="text-xs font-semibold text-secondary uppercase whitespace-nowrap">
              Filtrar por Médico:
            </label>
            <select
              value={selectedMedicoId}
              onChange={(e) => setSelectedMedicoId(e.target.value)}
              className="h-8 px-2 bg-surface text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">👨‍⚕️ Todos los Médicos (Todas las atenciones)</option>
              {medicosList.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  Dr. {m.name} {m.apellidos} {m.cmp_code ? `(${m.cmp_code})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-3 mb-4 text-xs font-semibold flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-tertiary-container/30 text-tertiary border-tertiary/40'
              : 'bg-error-container/30 text-error border-error/40'
          }`}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-sm font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* ── PANEL DE PACIENTES EN LISTA DE ESPERA MÉDICA ── */}
      <div className="bg-surface p-4 mb-5 border border-surface-container-high shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container-high mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="material-symbols-outlined text-[20px] text-primary">clinical_notes</span>
            <h2 className="text-sm font-bold tracking-tight text-on-surface uppercase">
              Pacientes para Consulta ({displayPatients.length})
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-primary-container text-on-primary-container font-bold">
              {displayPatients.filter((a) => a.status === 'en_espera_medico').length} en espera de atención
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-secondary text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por DNI, apellido o ticket..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-surface-container-low text-xs text-on-surface border border-surface-container-high focus:outline-none focus:border-primary placeholder:text-on-surface-variant/40 placeholder:italic"
            />
          </div>
        </div>

        {displayPatients.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto p-1">
            {displayPatients.map((atn) => {
              const ape = atn.apellidos || atn.beneficiario?.apellidos || 'PACIENTE'
              const nom = atn.nombres || atn.beneficiario?.nombres || ''
              const doc = atn.dni || atn.beneficiario?.dni || '--------'
              const esp = atn.specialty_name || 'Medicina General'
              const code = atn.ticket_codigo || `T-${atn.ticket_number}`
              const isSelected = atn.id === selectedAtencionId
              const isFinalized = atn.status === 'finalizado'
              const isEnConsulta = atn.status === 'en_consulta'

              return (
                <div
                  key={atn.id}
                  onClick={() => setSelectedAtencionId(atn.id)}
                  className={`p-2.5 border transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-sm ring-2 ring-primary/40'
                      : isFinalized
                      ? 'bg-surface-container-low/70 border-surface-container-high hover:border-tertiary/40'
                      : isEnConsulta
                      ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20'
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
                          : isFinalized
                          ? 'bg-tertiary-container text-on-tertiary-container'
                          : isEnConsulta
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-500/20 text-blue-700'
                      }`}
                    >
                      {isSelected ? 'EN CONSULTA' : isFinalized ? 'Atendido' : isEnConsulta ? 'Atendiendo' : 'Esperando'}
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
            No se encontraron pacientes asignados para consulta médica en este criterio.
          </div>
        )}
      </div>

      {/* ── CARD DEL PACIENTE ACTIVO Y SUS SIGNOS VITALES DE TRIAJE ── */}
      <section className="bg-surface shadow-xs border border-surface-container-high mb-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-surface-container-high mb-4">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-14 h-14 bg-primary-container text-on-primary-container flex items-center justify-center font-mono font-black text-xl border border-primary/20 shrink-0">
              #{ticketCodigo}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-on-surface uppercase">
                  {pacienteApellidos}, {pacienteNombres}
                </h2>
                <span className="text-xs text-on-surface-variant font-mono bg-surface-container-high px-2 py-0.5 border border-surface-container-high">
                  DNI: {pacienteDni}
                </span>
                <span className="text-xs bg-surface-container-high text-on-surface-variant px-2 py-0.5">
                  {pacienteEdad} • {pacienteSexo === 'F' ? 'Femenino' : 'Masculino'}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 uppercase ${
                    vitalsPrioridad === 'I'
                      ? 'bg-red-500 text-white'
                      : vitalsPrioridad === 'II'
                      ? 'bg-amber-400 text-black'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  Prioridad {vitalsPrioridad} ({vitalsColor.toUpperCase()})
                </span>
              </div>
              <div className="text-xs text-on-surface-variant mt-1">
                Comunidad: <strong className="text-on-surface uppercase">{pacienteComunidad}</strong> • Seguro: <strong className="text-on-surface">{pacienteSeguro}</strong> • Consultorio: <strong className="text-primary">{consultorioNombre}</strong> ({especialidadNombre})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewModalOpen(true)}
              className="px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-1.5 border border-surface-container-high cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">receipt_long</span>
              <span>Vista Previa Receta</span>
            </button>
            <button
              type="button"
              onClick={handlePrintReceta}
              className="px-3 py-2 bg-secondary hover:bg-on-secondary-container text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Re-imprimir Receta</span>
            </button>
          </div>
        </div>

        {/* CONSTANTES VITALES DE TRIAJE EVALUADAS */}
        <div>
          <div className="text-[11px] font-mono font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">monitor_heart</span>
            Constantes Vitales Registradas en Triaje Clínico:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
            <div className="bg-surface-container-low p-2 border border-surface-container-high">
              <span className="block text-[10px] text-secondary font-mono">P. ARTERIAL</span>
              <strong className="text-sm font-bold font-mono text-on-surface">{vitalsPa}</strong>
            </div>
            <div className="bg-surface-container-low p-2 border border-surface-container-high">
              <span className="block text-[10px] text-secondary font-mono">FREC. CARDÍACA</span>
              <strong className="text-sm font-bold font-mono text-on-surface">{vitalsFc}</strong>
            </div>
            <div className="bg-surface-container-low p-2 border border-surface-container-high">
              <span className="block text-[10px] text-secondary font-mono">TEMPERATURA</span>
              <strong className="text-sm font-bold font-mono text-on-surface">{vitalsTemp}</strong>
            </div>
            <div className="bg-surface-container-low p-2 border border-surface-container-high">
              <span className="block text-[10px] text-secondary font-mono">SATURACIÓN O2</span>
              <strong className="text-sm font-bold font-mono text-on-surface">{vitalsSpo2}</strong>
            </div>
            <div className="bg-surface-container-low p-2 border border-surface-container-high">
              <span className="block text-[10px] text-secondary font-mono">F. RESPIRATORIA</span>
              <strong className="text-sm font-bold font-mono text-on-surface">{vitalsFr}</strong>
            </div>
            <div className="bg-surface-container-low p-2 border border-surface-container-high">
              <span className="block text-[10px] text-secondary font-mono">GLUCEMIA</span>
              <strong className="text-sm font-bold font-mono text-on-surface">{vitalsGlucosa}</strong>
            </div>
            <div className="bg-surface-container-low p-2 border border-surface-container-high">
              <span className="block text-[10px] text-secondary font-mono">PESO / TALLA</span>
              <strong className="text-xs font-bold font-mono text-on-surface">{vitalsPeso} / {vitalsTalla}</strong>
            </div>
            <div className="bg-surface-container-low p-2 border border-surface-container-high">
              <span className="block text-[10px] text-secondary font-mono">IMC CALCULADO</span>
              <strong className="text-sm font-bold font-mono text-on-surface">{vitalsImc}</strong>
            </div>
          </div>

          {/* Alergias / Alerta */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="font-bold text-secondary uppercase font-mono">Alergias Conocidas:</span>
            {pacienteAlergias ? (
              <span className="px-2 py-0.5 bg-error-container text-error font-bold uppercase border border-error/30 animate-pulse">
                ⚠️ {pacienteAlergias}
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant font-mono">
                ✓ Niega alergias medicamentosas conocidas
              </span>
            )}
            <span className="text-secondary ml-3 font-mono truncate">
              Motivo Triaje: <em className="text-on-surface">{motivoConsultaTriaje}</em>
            </span>
          </div>
        </div>
      </section>

      {/* ── TABS DE DOCUMENTACIÓN CLÍNICA ── */}
      <div className="flex border-b border-surface-container-high mb-6 bg-surface">
        <button
          type="button"
          onClick={() => setActiveTab('clinica')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'clinica'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-secondary hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-base">notes</span>
          <span>1. Anamnesis & Examen Clínico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receta')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'receta'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-secondary hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-base">medication</span>
          <span>2. Diagnósticos & Receta Médica ({recetas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('indicaciones')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'indicaciones'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-secondary hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-base">assignment</span>
          <span>3. Plan de Tratamiento & Cuidados</span>
        </button>
      </div>

      {/* ── TAB 1: ANAMNESIS & EXAMEN FÍSICO ── */}
      {activeTab === 'clinica' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface p-5 border border-surface-container-high shadow-xs">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">history_edu</span>
              Anamnesis / Historia de la Enfermedad Actual:
            </h3>
            <p className="text-[11px] text-secondary mb-2">
              Detalle el tiempo de enfermedad, forma de inicio, síntomas cardinales y evolución.
            </p>
            <textarea
              rows={8}
              value={enfermedadActual}
              onChange={(e) => setEnfermedadActual(e.target.value)}
              className="w-full p-3 bg-surface-container-low text-xs text-on-surface border border-surface-container-high focus:outline-none focus:border-primary font-mono leading-relaxed"
              placeholder="Describa el relato cronológico de la enfermedad..."
            />
          </div>

          <div className="bg-surface p-5 border border-surface-container-high shadow-xs">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">stethoscope</span>
              Examen Físico Clínico por Sistemas:
            </h3>
            <p className="text-[11px] text-secondary mb-2">
              Describa el estado general, aparato respiratorio, cardiovascular, abdomen y extremidades.
            </p>
            <textarea
              rows={8}
              value={examenFisico}
              onChange={(e) => setExamenFisico(e.target.value)}
              className="w-full p-3 bg-surface-container-low text-xs text-on-surface border border-surface-container-high focus:outline-none focus:border-primary font-mono leading-relaxed"
              placeholder="Hallazgos relevantes al examen físico..."
            />
          </div>
        </div>
      )}

      {/* ── TAB 2: DIAGNÓSTICOS CIE-10 & RECETA MÉDICA CON VADEMÉCUM ── */}
      {activeTab === 'receta' && (
        <div className="flex flex-col gap-6">
          {/* SECCIÓN DIAGNÓSTICOS CIE-10 */}
          <div className="bg-surface p-5 border border-surface-container-high shadow-xs">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">medical_information</span>
              Diagnósticos Médicos (CIE-10):
            </h3>

            {/* Atajos de Diagnósticos Frecuentes */}
            <div className="mb-4">
              <span className="text-[11px] font-semibold text-secondary block mb-1.5">
                Diagnósticos frecuentes en campañas rurales (clic para agregar):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {FREQUENT_DIAGNOSTICS.map((fd) => (
                  <button
                    key={fd.cie10}
                    type="button"
                    onClick={() => handleSelectFrequentDx(fd)}
                    className="px-2 py-1 bg-surface-container-low hover:bg-surface-container-high text-[11px] border border-surface-container-high text-on-surface cursor-pointer flex items-center gap-1"
                  >
                    <strong className="text-primary font-mono">{fd.cie10}</strong> - {fd.descripcion}
                  </button>
                ))}
              </div>
            </div>

            {/* Agregar nuevo diagnóstico manual */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-4 bg-surface-container-low p-3 border border-surface-container-high">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-secondary uppercase mb-1">CIE-10</label>
                <input
                  type="text"
                  placeholder="Ej: M54.5"
                  value={nuevoCie}
                  onChange={(e) => setNuevoCie(e.target.value)}
                  className="w-full h-8 px-2 bg-surface text-xs font-mono border border-surface-container-high uppercase"
                />
              </div>
              <div className="sm:col-span-7">
                <label className="block text-[10px] font-bold text-secondary uppercase mb-1">Descripción del Diagnóstico</label>
                <input
                  type="text"
                  placeholder="Ej: Lumbago no especificado"
                  value={nuevoDesc}
                  onChange={(e) => setNuevoDesc(e.target.value)}
                  className="w-full h-8 px-2 bg-surface text-xs border border-surface-container-high"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-secondary uppercase mb-1">Tipo</label>
                <select
                  value={tipoDx}
                  onChange={(e) => setTipoDx(e.target.value as any)}
                  className="w-full h-8 px-2 bg-surface text-xs border border-surface-container-high"
                >
                  <option value="definitivo">Definitivo</option>
                  <option value="presuntivo">Presuntivo</option>
                  <option value="repetido">Repetido</option>
                </select>
              </div>
              <div className="sm:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={handleAddDiagnostico}
                  className="w-full h-8 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-bold flex items-center justify-center cursor-pointer"
                  title="Agregar diagnóstico"
                >
                  +
                </button>
              </div>
            </div>

            {/* Tabla de diagnósticos registrados */}
            <div className="space-y-1.5">
              {diagnosticos.map((d, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-surface-container-low border border-surface-container-high text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5">
                      {d.cie10}
                    </span>
                    <span className="font-semibold text-on-surface">{d.descripcion}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-surface-container-high text-secondary">
                      {d.tipo}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDiagnostico(idx)}
                    className="text-error hover:text-red-700 text-xs px-2 py-1 font-bold cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN RECETA MÉDICA & VADEMÉCUM */}
          <div className="bg-surface p-5 border border-surface-container-high shadow-xs">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">prescriptions</span>
              Prescripción Farmacológica (Receta & Posología):
            </h3>
            <p className="text-[11px] text-secondary mb-3">
              Seleccione los medicamentos del catálogo de farmacia e indique la posología detallada que se imprimirá en el segundo ticket.
            </p>

            {/* Formulario de Prescripción */}
            <div className="bg-surface-container-low p-4 border border-surface-container-high mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3">
                {/* Selector de Medicamento */}
                <div className="sm:col-span-6">
                  <label className="block text-[10px] font-bold text-secondary uppercase mb-1">
                    Seleccionar Medicamento (Vademécum):
                  </label>
                  <select
                    value={selectedMedId}
                    onChange={(e) => handleSelectMedicamento(e.target.value)}
                    className="w-full h-9 px-2 bg-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Seleccione del vademécum o ingrese manual --</option>
                    {medicamentosList.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.nombre_generico} {m.concentracion ? `• ${m.concentracion}` : ''} ({m.forma_farmaceutica})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nombre de Medicamento y Concentración */}
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold text-secondary uppercase mb-1">
                    Nombre del Medicamento & Dosis:
                  </label>
                  <input
                    type="text"
                    value={nombreMedCustom}
                    onChange={(e) => setNombreMedCustom(e.target.value)}
                    placeholder="Ej: Paracetamol 500 mg"
                    className="w-full h-9 px-2 bg-surface text-xs border border-surface-container-high focus:outline-none"
                  />
                </div>

                {/* Forma Farmacéutica */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-secondary uppercase mb-1">
                    Presentación:
                  </label>
                  <input
                    type="text"
                    value={formaFarmaceutica}
                    onChange={(e) => setFormaFarmaceutica(e.target.value)}
                    placeholder="Tableta, Jarabe..."
                    className="w-full h-9 px-2 bg-surface text-xs border border-surface-container-high"
                  />
                </div>
              </div>

              {/* Posología Detallada */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3">
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-secondary uppercase mb-1">
                    Dosis por toma:
                  </label>
                  <input
                    type="text"
                    value={dosisInput}
                    onChange={(e) => setDosisInput(e.target.value)}
                    placeholder="1 tableta, 5 mL..."
                    className="w-full h-8 px-2 bg-surface text-xs border border-surface-container-high"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-secondary uppercase mb-1">
                    Frecuencia:
                  </label>
                  <select
                    value={frecuenciaInput}
                    onChange={(e) => setFrecuenciaInput(e.target.value)}
                    className="w-full h-8 px-2 bg-surface text-xs border border-surface-container-high cursor-pointer"
                  >
                    <option value="Cada 6 horas">Cada 6 horas (4 veces al día)</option>
                    <option value="Cada 8 horas">Cada 8 horas (3 veces al día)</option>
                    <option value="Cada 12 horas">Cada 12 horas (2 veces al día)</option>
                    <option value="Cada 24 horas">Cada 24 horas (1 vez al día)</option>
                    <option value="Condicional a dolor o fiebre">Condicional a dolor o fiebre &gt; 38°C</option>
                    <option value="Antes de dormir">Antes de dormir (Noche)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-secondary uppercase mb-1">
                    Duración:
                  </label>
                  <select
                    value={duracionInput}
                    onChange={(e) => setDuracionInput(e.target.value)}
                    className="w-full h-8 px-2 bg-surface text-xs border border-surface-container-high cursor-pointer"
                  >
                    <option value="3 días">3 días</option>
                    <option value="5 días">5 días</option>
                    <option value="7 días">7 días</option>
                    <option value="10 días">10 días</option>
                    <option value="14 días">14 días</option>
                    <option value="30 días">30 días (Crónico)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-secondary uppercase mb-1">
                    Vía de Adm.:
                  </label>
                  <select
                    value={viaInput}
                    onChange={(e) => setViaInput(e.target.value)}
                    className="w-full h-8 px-2 bg-surface text-xs border border-surface-container-high cursor-pointer"
                  >
                    <option value="Oral">Oral</option>
                    <option value="Tópica">Tópica</option>
                    <option value="Inyectable IM">Inyectable IM</option>
                    <option value="Oftálmica">Oftálmica</option>
                    <option value="Inhalatoria">Inhalatoria</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-secondary uppercase mb-1">
                    Cantidad a Despachar:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cantidadInput}
                    onChange={(e) => setCantidadInput(e.target.value)}
                    placeholder="Ej: 10"
                    className="w-full h-8 px-2 bg-surface text-xs border border-surface-container-high"
                  />
                </div>
              </div>

              {/* Indicaciones de Toma */}
              <div className="flex flex-col sm:flex-row items-end gap-3">
                <div className="w-full">
                  <label className="block text-[10px] font-bold text-secondary uppercase mb-1">
                    Indicaciones precisas para el paciente o familiar:
                  </label>
                  <input
                    type="text"
                    value={indicacionesInput}
                    onChange={(e) => setIndicacionesInput(e.target.value)}
                    placeholder="Ej: Tomar con abundante agua después de los alimentos. No ingerir alcohol."
                    className="w-full h-8 px-2 bg-surface text-xs border border-surface-container-high"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddReceta}
                  className="px-5 py-1.5 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  <span>Agregar a Receta</span>
                </button>
              </div>
            </div>

            {/* Lista de Medicamentos en la Receta */}
            <div className="border border-surface-container-high overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-secondary font-mono text-[10px] uppercase border-b border-surface-container-high">
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Medicamento</th>
                    <th className="p-2.5">Posología & Frecuencia</th>
                    <th className="p-2.5">Duración</th>
                    <th className="p-2.5">Cant.</th>
                    <th className="p-2.5">Indicaciones de Toma</th>
                    <th className="p-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {recetas.length > 0 ? (
                    recetas.map((r, i) => (
                      <tr key={i} className="hover:bg-surface-container-low/50">
                        <td className="p-2.5 font-bold font-mono text-primary">{i + 1}</td>
                        <td className="p-2.5 font-bold text-on-surface">
                          {r.nombre}
                          <span className="block text-[10px] text-secondary font-mono">{r.forma} • Vía {r.via}</span>
                        </td>
                        <td className="p-2.5 font-mono text-on-surface">
                          {r.dosis} • <span className="text-secondary">{r.frecuencia}</span>
                        </td>
                        <td className="p-2.5 font-mono">{r.duracion}</td>
                        <td className="p-2.5 font-mono font-bold">{r.cantidad}</td>
                        <td className="p-2.5 text-secondary text-[11px]">{r.indicaciones}</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveReceta(i)}
                            className="text-error hover:text-red-700 text-xs font-bold cursor-pointer"
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-secondary text-xs">
                        No hay medicamentos prescritos aún. Agregue medicamentos usando el formulario superior.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: PLAN DE TRATAMIENTO & CUIDADOS ── */}
      {activeTab === 'indicaciones' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface p-5 border border-surface-container-high shadow-xs">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">healing</span>
              Plan de Tratamiento & Conducta Médica:
            </h3>
            <p className="text-[11px] text-secondary mb-2">
              Indique los objetivos terapéuticos, medidas físicas, ejercicios o seguimiento.
            </p>
            <textarea
              rows={8}
              value={planTratamiento}
              onChange={(e) => setPlanTratamiento(e.target.value)}
              className="w-full p-3 bg-surface-container-low text-xs text-on-surface border border-surface-container-high focus:outline-none focus:border-primary font-mono leading-relaxed"
            />
          </div>

          <div className="bg-surface p-5 border border-surface-container-high shadow-xs">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">warning</span>
              Indicaciones Generales y Signos de Alarma:
            </h3>
            <p className="text-[11px] text-secondary mb-2">
              Se imprimirán al pie de la receta médica para conocimiento del paciente y la brigada.
            </p>
            <textarea
              rows={8}
              value={indicacionesGenerales}
              onChange={(e) => setIndicacionesGenerales(e.target.value)}
              className="w-full p-3 bg-surface-container-low text-xs text-on-surface border border-surface-container-high focus:outline-none focus:border-primary font-mono leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ── BARRA DE ACCIÓN PRINCIPAL AL PIE: GUARDAR & EMITIR RECETA ── */}
      <div className="mt-8 bg-surface p-4 border border-surface-container-high shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
        <div>
          <div className="text-xs font-bold uppercase text-on-surface">
            Paciente: <span className="text-primary">{pacienteApellidos}, {pacienteNombres}</span> (#{ticketCodigo})
          </div>
          <div className="text-[11px] text-secondary font-mono">
            Médico Tratante: <strong className="text-on-surface">{currentDoctorName}</strong> • {currentDoctorCmp}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold uppercase tracking-wider border border-surface-container-high cursor-pointer transition-colors disabled:opacity-50"
            title="Guarda los avances clínicos y mantiene la atención activa en consulta sin cerrar ni imprimir"
          >
            {saving ? 'Guardando...' : 'Solo Guardar Consulta'}
          </button>

          <button
            type="button"
            onClick={handleFinalizeAndPrint}
            disabled={saving}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
            title="Guarda la consulta, actualiza el estado a Finalizado y envía a imprimir el ticket de receta médica"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>{saving ? 'Guardando e Imprimiendo...' : 'Finalizar Consulta & Imprimir Receta'}</span>
          </button>
        </div>
      </div>

      {/* ── SEGUNDO TICKET: COMPONENTE TÉRMICO OCULTO/PRINTABLE (80mm / 58mm) ── */}
      {/* Este componente es renderizado con precisión ESC/POS para ser consumido por printThermalElement */}
      <div className="hidden">
        <div
          id="receta-thermal-printable"
          className="bg-white text-black p-2 text-left"
          style={{
            width: '78mm',
            maxWidth: '78mm',
            color: '#000000',
            backgroundColor: '#ffffff',
            margin: '0 auto',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace',
            lineHeight: 1.35,
          }}
        >
          {/* Logo si está activo */}
          {effectiveLogo && (
            <div className="text-center mb-2">
              <img
                src={effectiveLogo}
                alt="Logo Institucional"
                className="max-h-14 max-w-[55mm] mx-auto object-contain"
                style={{ filter: 'grayscale(100%) contrast(180%)' }}
              />
            </div>
          )}

          {/* Encabezado Institucional */}
          <div className="text-center font-black text-sm uppercase leading-tight mb-1 text-black">
            {branding.exportHeader || 'ONG SEMILLA - BRIGADA DE SALUD'}
          </div>
          <div className="text-center text-xs font-bold text-black uppercase mb-2">
            {branding.exportSubheader || 'SISTEMA DE ATENCIÓN MÉDICA Y TRIAJE'}
          </div>

          {/* Título del Ticket y Turno */}
          <div className="border-t-2 border-b-2 border-black py-2 my-2 text-center">
            <span className="text-xs font-black block uppercase tracking-wide text-black">
              RECETA MÉDICA & ORDEN DE FARMACOVIGILANCIA
            </span>
            <span className="text-3xl font-black block tracking-widest my-1 text-black">
              #{ticketCodigo}
            </span>
            <span className="text-xs font-black uppercase block text-black">
              {especialidadNombre} • {consultorioNombre}
            </span>
          </div>

          {/* Datos del Paciente */}
          <div className="space-y-1 mb-2 text-xs text-black">
            <div className="text-sm font-black text-black">
              PACIENTE: {pacienteApellidos}, {pacienteNombres}
            </div>
            <div>
              <strong>DNI:</strong> {pacienteDni} &nbsp;|&nbsp; <strong>EDAD:</strong> {pacienteEdad} &nbsp;|&nbsp; <strong>SEXO:</strong> {pacienteSexo}
            </div>
            <div>
              <strong>COMUNIDAD:</strong> {pacienteComunidad}
            </div>
            <div>
              <strong>SEGURO:</strong> {pacienteSeguro}
            </div>
            <div>
              <strong>FECHA / HORA:</strong> {new Date().toLocaleDateString('es-PE')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            {pacienteAlergias && (
              <div className="font-black border-2 border-black p-1 mt-1 text-xs text-black">
                ⚠️ ALERGIAS: {pacienteAlergias}
              </div>
            )}
          </div>

          {/* Signos Vitales de Triaje resumidos */}
          <div className="border-t-2 border-b border-black py-1.5 text-xs text-black">
            <div className="font-black uppercase mb-0.5">CONSTANTES VITALES (TRIAJE):</div>
            <div>
              <strong>PA:</strong> {vitalsPa} &nbsp;•&nbsp; <strong>FC:</strong> {vitalsFc} &nbsp;•&nbsp; <strong>T°:</strong> {vitalsTemp} &nbsp;•&nbsp; <strong>SpO2:</strong> {vitalsSpo2}
            </div>
            <div>
              <strong>PESO:</strong> {vitalsPeso} &nbsp;•&nbsp; <strong>TALLA:</strong> {vitalsTalla} &nbsp;•&nbsp; <strong>IMC:</strong> {vitalsImc}
            </div>
          </div>

          {/* Diagnósticos CIE-10 */}
          {diagnosticos.length > 0 && (
            <div className="border-b border-black py-1.5 text-xs text-black">
              <div className="font-black uppercase mb-1">DIAGNÓSTICOS:</div>
              {diagnosticos.map((d, i) => (
                <div key={i} className="pl-1">
                  • <strong className="font-black">{d.cie10}</strong>: {d.descripcion} ({d.tipo})
                </div>
              ))}
            </div>
          )}

          {/* CUERPO DE LA RECETA CON POSOLOGÍA DETALLADA */}
          <div className="border-t-2 border-b-2 border-black py-2 my-2 text-black">
            <div className="font-black text-center text-sm uppercase mb-2 tracking-wider">
              Rp. / PRESCRIPCIÓN & POSOLOGÍA
            </div>
            <div className="space-y-2.5">
              {recetas.map((r, i) => (
                <div key={i} className="border-b border-black pb-2">
                  <div className="font-black text-sm uppercase text-black">
                    {i + 1}. {r.nombre} ({r.forma})
                  </div>
                  <div className="pl-2 text-xs font-black text-black mt-0.5">
                    TOMA: {r.dosis} • {r.frecuencia}
                  </div>
                  <div className="pl-2 text-xs font-black text-black">
                    DURACIÓN: {r.duracion} &nbsp;|&nbsp; CANTIDAD: {r.cantidad}
                  </div>
                  <div className="pl-2 text-xs font-bold text-black">
                    VÍA: {r.via}
                  </div>
                  {r.indicaciones && (
                    <div className="pl-2 text-xs font-medium text-black mt-0.5">
                      Indicación: {r.indicaciones}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Indicaciones Generales */}
          {indicacionesGenerales && (
            <div className="text-xs mb-3 text-black">
              <strong className="block uppercase font-black">INDICACIONES GENERALES:</strong>
              <p className="pl-1 text-xs font-medium mt-0.5">{indicacionesGenerales}</p>
            </div>
          )}

          {/* ── ESPACIO PARA SELLO Y FIRMA DEL MÉDICO ── */}
          <div className="my-3 pt-1 text-black">
            <div
              className="border-2 border-black p-2.5 text-center"
              style={{ minHeight: '46mm' }}
            >
              <div className="text-xs uppercase font-black tracking-wider text-black">
                ESPACIO EXCLUSIVO PARA FIRMA Y SELLO MÉDICO
              </div>
              <div className="text-[10px] uppercase font-bold text-black mb-6">
                MÉDICO TRATANTE RESPONSABLE
              </div>

              {/* Si hay sello institucional o gráfico */}
              {branding.footerLogoUrl && (
                <div className="my-1">
                  <img
                    src={branding.footerLogoUrl}
                    alt="Sello Médico"
                    className="max-h-12 mx-auto object-contain"
                    style={{ filter: 'grayscale(100%) contrast(180%)' }}
                  />
                </div>
              )}

              <div className="border-t-2 border-black w-4/5 mx-auto pt-1.5 mt-8 text-black">
                <div className="font-black text-sm uppercase leading-tight text-black">
                  {currentDoctorName}
                </div>
                <div className="text-xs font-mono font-black leading-tight text-black mt-0.5">
                  {currentDoctorCmp}
                </div>
                <div className="text-xs uppercase font-bold text-black mt-0.5">
                  {especialidadNombre} • {consultorioNombre}
                </div>
              </div>
            </div>
          </div>

          {/* Código QR y Hash de Autenticidad */}
          {qrRecetaDataUrl && (
            <div className="text-center my-2">
              <img src={qrRecetaDataUrl} alt="QR Receta" className="w-28 h-28 mx-auto" />
              <div className="text-[10px] font-mono font-bold text-black mt-1">
                Autenticidad de Consulta Médica • Brigada Semilla
              </div>
            </div>
          )}

          {/* Pie Legal */}
          <div className="text-center text-[10.5px] font-bold text-black mt-2 border-t border-black pt-1.5">
            {branding.exportFooterLegal || 'Presente esta receta médica en el módulo de farmacia de la campaña para la entrega de sus medicinas.'}
          </div>
        </div>
      </div>

      {/* ── MODAL DE VISTA PREVIA DEL TICKET TÉRMICO ── */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border-2 border-primary shadow-2xl w-full max-w-lg p-5 text-on-surface max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                <h3 className="text-sm font-bold uppercase">Previsualización del Segundo Ticket (Receta Térmica)</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="text-secondary hover:text-on-surface font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-3 bg-gray-300 border border-surface-container-high flex justify-center">
              <div
                className="bg-white text-black p-4 text-left shadow-2xl"
                style={{
                  width: '78mm',
                  color: '#000000',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace',
                  lineHeight: 1.35,
                }}
              >
                {effectiveLogo && (
                  <div className="text-center mb-2">
                    <img src={effectiveLogo} alt="Logo" className="max-h-12 mx-auto object-contain" />
                  </div>
                )}
                <div className="text-center font-black text-sm uppercase leading-tight">{branding.exportHeader || 'ONG SEMILLA - BRIGADA DE SALUD'}</div>
                <div className="text-center text-xs font-bold uppercase mb-2">{branding.exportSubheader || 'SISTEMA DE ATENCIÓN MÉDICA Y TRIAJE'}</div>

                <div className="border-t-2 border-b-2 border-black py-2 text-center my-2">
                  <div className="text-xs font-black uppercase">RECETA MÉDICA & ORDEN DE FARMACOVIGILANCIA</div>
                  <div className="text-3xl font-black my-1">#{ticketCodigo}</div>
                  <div className="text-xs uppercase font-black">{especialidadNombre} • {consultorioNombre}</div>
                </div>

                <div className="text-xs space-y-1 mb-2">
                  <div className="text-sm font-black">PACIENTE: {pacienteApellidos}, {pacienteNombres}</div>
                  <div><strong>DNI:</strong> {pacienteDni} &nbsp;|&nbsp; <strong>EDAD:</strong> {pacienteEdad}</div>
                  <div><strong>COMUNIDAD:</strong> {pacienteComunidad}</div>
                  <div><strong>FECHA / HORA:</strong> {new Date().toLocaleDateString('es-PE')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  {pacienteAlergias && (
                    <div className="font-black border-2 border-black p-1 text-xs">⚠️ ALERGIAS: {pacienteAlergias}</div>
                  )}
                </div>

                <div className="border-t-2 border-b-2 border-black py-2 my-2">
                  <div className="font-black text-center text-sm uppercase mb-1.5">Rp. / POSOLOGÍA</div>
                  <div className="space-y-2">
                    {recetas.map((r, i) => (
                      <div key={i} className="border-b border-black pb-1.5">
                        <div className="font-black text-sm uppercase">{i + 1}. {r.nombre} ({r.forma})</div>
                        <div className="pl-2 text-xs font-black">TOMA: {r.dosis} • {r.frecuencia} por {r.duracion}</div>
                        <div className="pl-2 text-xs font-bold">VÍA: {r.via} &nbsp;|&nbsp; CANTIDAD: {r.cantidad}</div>
                        {r.indicaciones && <div className="pl-2 text-xs font-medium">Indicación: {r.indicaciones}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {indicacionesGenerales && (
                  <div className="text-xs mb-2">
                    <strong className="block uppercase font-black">INDICACIONES GENERALES:</strong>
                    <p className="pl-1 text-xs font-medium">{indicacionesGenerales}</p>
                  </div>
                )}

                <div className="border-2 border-black p-2.5 my-3 text-center" style={{ minHeight: '44mm' }}>
                  <div className="text-xs font-black uppercase">ESPACIO EXCLUSIVO PARA FIRMA Y SELLO MÉDICO</div>
                  <div className="border-t-2 border-black w-4/5 mx-auto pt-1 mt-8">
                    <div className="font-black text-sm uppercase">{currentDoctorName}</div>
                    <div className="text-xs font-mono font-black">{currentDoctorCmp}</div>
                    <div className="text-xs uppercase font-bold">{especialidadNombre}</div>
                  </div>
                </div>

                {qrRecetaDataUrl && (
                  <div className="text-center my-2">
                    <img src={qrRecetaDataUrl} alt="QR" className="w-24 h-24 mx-auto" />
                  </div>
                )}
                <div className="text-center text-[10px] font-bold border-t border-black pt-1">
                  {branding.exportFooterLegal || 'Presente esta receta en el módulo de farmacia de la brigada.'}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-container-high mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 bg-surface-container-high text-xs font-semibold"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewModalOpen(false)
                  handlePrintReceta()
                }}
                className="px-4 py-2 bg-primary text-on-primary text-xs font-bold uppercase flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Imprimir Ticket Ahora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
