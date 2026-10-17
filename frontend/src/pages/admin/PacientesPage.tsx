import { useState } from 'react'
import {
  useBeneficiarios,
  useBeneficiario,
  useUpdateBeneficiario,
} from '../../api/hooks'
import type { Beneficiario } from '../../api/hooks'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

export default function PacientesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Beneficiario | null>(null)

  // Auth User & Permisos para edición de triaje
  const user = useAuthStore((s) => s.user)
  const canEditTriaje = user?.role === 'admin' || user?.role === 'medico'

  // Full Edit fields matching BeneficiarioPage
  const [dni, setDni] = useState('')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [sexo, setSexo] = useState<'M' | 'F' | 'O'>('M')
  const [estadoCivil, setEstadoCivil] = useState('conviviente')
  const [idioma, setIdioma] = useState('quechua')
  const [comunidad, setComunidad] = useState('rumichaca')
  const [celular, setCelular] = useState('')
  const [altitud, setAltitud] = useState<number | ''>(3450)
  const [tiempoViaje, setTiempoViaje] = useState('60')
  const [seguro, setSeguro] = useState('sis')

  // Antecedentes & Factores de Riesgo
  const [hipertension, setHipertension] = useState(false)
  const [diabetes, setDiabetes] = useState(false)
  const [asma, setAsma] = useState(false)
  const [anemia, setAnemia] = useState(false)
  const [gestante, setGestante] = useState(false)
  const [alergias, setAlergias] = useState('')
  const [motivo, setMotivo] = useState('')

  // Campos de Triaje Clínico
  const [triajePrioridad, setTriajePrioridad] = useState<'I' | 'II' | 'III'>('II')
  const [triajePaSistolica, setTriajePaSistolica] = useState<string>('')
  const [triajePaDiastolica, setTriajePaDiastolica] = useState<string>('')
  const [triajeFc, setTriajeFc] = useState<string>('')
  const [triajeFr, setTriajeFr] = useState<string>('')
  const [triajeTemperatura, setTriajeTemperatura] = useState<string>('')
  const [triajeSpo2, setTriajeSpo2] = useState<string>('')
  const [triajeGlucosa, setTriajeGlucosa] = useState<string>('')
  const [triajePeso, setTriajePeso] = useState<string>('')
  const [triajeTalla, setTriajeTalla] = useState<string>('')
  const [triajeGlasgow, setTriajeGlasgow] = useState<string>('15')
  const [triajeObservaciones, setTriajeObservaciones] = useState<string>('')
  const [loadingTriaje, setLoadingTriaje] = useState(false)

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const { data: responseData, isLoading, refetch } = useBeneficiarios({
    search: searchTerm || undefined,
    page,
  })

  const { data: patientDetail, isLoading: isLoadingDetail } = useBeneficiario(selectedPatientId || 0)
  const updateBeneficiario = useUpdateBeneficiario()

  const patients = responseData?.data || []
  const total = responseData?.total || patients.length
  const lastPage = responseData?.last_page || 1

  const calculateAge = (dob: string) => {
    if (!dob) return 0
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  // Cálculo de IMC para triaje
  const triajeNumPeso = parseFloat(triajePeso)
  const triajeNumTalla = parseFloat(triajeTalla)
  const triajeImc =
    triajeNumPeso > 0 && triajeNumTalla > 0
      ? (triajeNumPeso / (triajeNumTalla * triajeNumTalla)).toFixed(1)
      : null

  const openEditModal = async (p: Beneficiario) => {
    setEditingPatient(p)
    setDni(p.dni)
    setNombres(p.nombres)
    setApellidos(p.apellidos)
    setFechaNac(p.fecha_nacimiento ? p.fecha_nacimiento.split('T')[0] : '')
    setSexo(p.sexo)
    setEstadoCivil(p.estado_civil || 'conviviente')
    setIdioma(p.idioma_principal || 'quechua')
    setComunidad(p.comunidad || 'rumichaca')
    setCelular(p.celular || '')
    setAltitud(p.altitud_residencia ?? 3450)
    setTiempoViaje('60')
    setSeguro(p.tipo_seguro || 'sis')
    setHipertension(false)
    setDiabetes(false)
    setAsma(false)
    setAnemia(false)
    setGestante(false)
    setAlergias((p as any).alergias || '')
    setMotivo((p as any).motivo || '')

    // Inicializar datos de triaje si vienen en la lista index
    const pAny = p as any
    const rawPri = (pAny.triaje_prioridad || 'II').toUpperCase()
    setTriajePrioridad(rawPri === 'I' ? 'I' : rawPri === 'III' ? 'III' : 'II')
    setTriajePaSistolica(pAny.triaje_pa_sistolica ? String(pAny.triaje_pa_sistolica) : '')
    setTriajePaDiastolica(pAny.triaje_pa_diastolica ? String(pAny.triaje_pa_diastolica) : '')
    setTriajeFc(pAny.triaje_fc ? String(pAny.triaje_fc) : '')
    setTriajeFr(pAny.triaje_fr ? String(pAny.triaje_fr) : '')
    setTriajeTemperatura(pAny.triaje_temperatura ? String(pAny.triaje_temperatura) : '')
    setTriajeSpo2(pAny.triaje_spo2 ? String(pAny.triaje_spo2) : '')
    setTriajeGlucosa(pAny.triaje_glucosa ? String(pAny.triaje_glucosa) : '')
    setTriajePeso(pAny.triaje_peso ? String(pAny.triaje_peso) : (p.peso_kg ? String(p.peso_kg) : ''))
    setTriajeTalla(
      pAny.triaje_talla
        ? String(pAny.triaje_talla > 3 ? (pAny.triaje_talla / 100).toFixed(2) : pAny.triaje_talla)
        : p.talla_cm
        ? String(p.talla_cm > 3 ? (p.talla_cm / 100).toFixed(2) : p.talla_cm)
        : ''
    )
    setTriajeGlasgow('15')
    setTriajeObservaciones(pAny.triaje_observaciones || '')

    setEditModalOpen(true)
    setLoadingTriaje(true)

    // Cargar datos completos y atenciones asociadas desde la API
    try {
      const res = await api.get(`/beneficiarios/${p.id}`)
      const full = res.data
      if (full.triaje) {
        const t = full.triaje
        const pri = (t.prioridad || 'II').toUpperCase()
        setTriajePrioridad(pri === 'I' ? 'I' : pri === 'III' ? 'III' : 'II')
        setTriajePaSistolica(t.presion_sistolica ? String(t.presion_sistolica) : '')
        setTriajePaDiastolica(t.presion_diastolica ? String(t.presion_diastolica) : '')
        setTriajeFc(t.frecuencia_cardiaca ? String(t.frecuencia_cardiaca) : '')
        setTriajeFr(t.frecuencia_respiratoria ? String(t.frecuencia_respiratoria) : '')
        setTriajeTemperatura(t.temperatura_c ? String(t.temperatura_c) : '')
        setTriajeSpo2(t.saturacion_o2_pct ? String(t.saturacion_o2_pct) : '')
        setTriajeGlucosa(t.glucosa_mg_dl ? String(t.glucosa_mg_dl) : '')
        if (t.peso_kg) setTriajePeso(String(t.peso_kg))
        if (t.talla_cm) {
          setTriajeTalla(String(t.talla_cm > 3 ? (t.talla_cm / 100).toFixed(2) : t.talla_cm))
        }
        setTriajeGlasgow(t.escala_glasgow ? String(t.escala_glasgow) : '15')
        setTriajeObservaciones(t.observaciones_triaje || '')
      } else if (full.atenciones && full.atenciones.length > 0) {
        const atn = full.atenciones[0]
        if (atn.triaje_id) {
          const pri = (atn.prioridad || 'II').toUpperCase()
          setTriajePrioridad(pri === 'I' ? 'I' : pri === 'III' ? 'III' : 'II')
          setTriajePaSistolica(atn.presion_sistolica ? String(atn.presion_sistolica) : '')
          setTriajePaDiastolica(atn.presion_diastolica ? String(atn.presion_diastolica) : '')
          setTriajeFc(atn.frecuencia_cardiaca ? String(atn.frecuencia_cardiaca) : '')
          setTriajeFr(atn.frecuencia_respiratoria ? String(atn.frecuencia_respiratoria) : '')
          setTriajeTemperatura(atn.temperatura_c ? String(atn.temperatura_c) : '')
          setTriajeSpo2(atn.saturacion_o2_pct ? String(atn.saturacion_o2_pct) : '')
          setTriajeGlucosa(atn.glucosa_mg_dl ? String(atn.glucosa_mg_dl) : '')
          if (atn.triaje_peso_kg) setTriajePeso(String(atn.triaje_peso_kg))
          if (atn.triaje_talla_cm) {
            setTriajeTalla(
              String(atn.triaje_talla_cm > 3 ? (atn.triaje_talla_cm / 100).toFixed(2) : atn.triaje_talla_cm)
            )
          }
          setTriajeObservaciones(atn.observaciones_triaje || '')
        }
      }
    } catch (err) {
      console.warn('[PacientesPage] Error cargando ficha completa:', err)
    } finally {
      setLoadingTriaje(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPatient) return
    setMessage(null)
    try {
      const updatePayload: { id: number } & Record<string, any> = {
        id: editingPatient.id,
        dni: dni.trim(),
        nombres: nombres.trim().toUpperCase(),
        apellidos: apellidos.trim().toUpperCase(),
        fecha_nacimiento: fechaNac,
        sexo,
        estado_civil: estadoCivil,
        idioma_principal: idioma,
        comunidad,
        celular,
        altitud_residencia: altitud === '' ? null : Number(altitud),
        tipo_seguro: seguro,
      }

      // Si el rol es médico o administrador, enviar también los datos modificados de triaje
      if (canEditTriaje) {
        updatePayload.triaje = {
          prioridad: triajePrioridad,
          prioridad_label:
            triajePrioridad === 'I'
              ? 'Emergencia (Rojo)'
              : triajePrioridad === 'II'
              ? 'Urgencia Relativa (Amarillo)'
              : 'No Urgente (Verde)',
          prioridad_color:
            triajePrioridad === 'I' ? 'rojo' : triajePrioridad === 'II' ? 'amarillo' : 'verde',
          presion_sistolica: triajePaSistolica ? parseInt(triajePaSistolica, 10) : null,
          presion_diastolica: triajePaDiastolica ? parseInt(triajePaDiastolica, 10) : null,
          frecuencia_cardiaca: triajeFc ? parseInt(triajeFc, 10) : null,
          frecuencia_respiratoria: triajeFr ? parseInt(triajeFr, 10) : null,
          temperatura_c: triajeTemperatura ? parseFloat(triajeTemperatura) : null,
          saturacion_o2_pct: triajeSpo2 ? parseInt(triajeSpo2, 10) : null,
          glucosa_mg_dl: triajeGlucosa ? parseInt(triajeGlucosa, 10) : null,
          peso_kg: triajePeso ? parseFloat(triajePeso) : null,
          talla_cm: triajeTalla
            ? Math.round(parseFloat(triajeTalla) * (parseFloat(triajeTalla) < 3 ? 100 : 1))
            : null,
          escala_glasgow: triajeGlasgow ? parseInt(triajeGlasgow, 10) : 15,
          observaciones_triaje: triajeObservaciones,
        }
      }

      await updateBeneficiario.mutateAsync(updatePayload)
      setMessage({
        text: canEditTriaje
          ? '✓ Datos del paciente y constantes de triaje actualizados exitosamente.'
          : '✓ Datos demográficos del paciente actualizados exitosamente.',
        type: 'success',
      })
      setEditModalOpen(false)
      refetch()
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message
      setMessage({ text: `Error al actualizar paciente: ${apiMsg}`, type: 'error' })
    }
  }

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-primary-container text-on-primary-fixed">
              ADMIN-03
            </span>
            <span className="px-2 py-0.5 text-[11px] font-medium bg-surface-container text-on-surface-variant flex items-center gap-1.5 border border-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              Padrón Comunitario de Beneficiarios
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-on-surface">
            Gestión y Padrón de <span className="font-semibold text-primary">Pacientes</span>
          </h1>
        </div>

        <Link
          to="/admision"
          className="h-10 px-5 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-semibold uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer rounded-none self-start lg:self-auto transition-colors"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          <span>Registrar Nuevo Paciente</span>
        </Link>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 border text-xs font-medium flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-tertiary-container text-on-tertiary-container border-tertiary/40'
              : 'bg-error-container text-on-error-container border-error/40'
          }`}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="cursor-pointer font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 mb-6 border border-surface-container-high shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por DNI, nombres o apellidos..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className="w-full h-10 pl-10 pr-4 bg-surface-container text-xs text-on-surface border border-surface-container-high placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant self-end sm:self-auto">
          <span>Total en Padrón:</span>
          <strong className="text-primary font-bold">{total} pacientes</strong>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-surface border border-surface-container-high shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-on-surface-variant">
            Cargando padrón de pacientes...
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-on-surface-variant">
            No se encontraron pacientes que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant font-mono uppercase text-[11px] border-b border-surface-container-high">
                  <th className="py-3 px-4">DNI</th>
                  <th className="py-3 px-4">Apellidos y Nombres</th>
                  <th className="py-3 px-4">Edad / Sexo</th>
                  <th className="py-3 px-4">Comunidad</th>
                  <th className="py-3 px-4">Seguro</th>
                  <th className="py-3 px-4">Últ. Triaje</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {patients.map((p: any) => (
                  <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-on-surface">{p.dni}</td>
                    <td className="py-3 px-4 font-semibold uppercase text-on-surface">
                      {p.apellidos}, {p.nombres}
                    </td>
                    <td className="py-3 px-4">
                      {p.edad_calculada ?? calculateAge(p.fecha_nacimiento)} años •{' '}
                      <span className="font-mono">{p.sexo}</span>
                    </td>
                    <td className="py-3 px-4 capitalize">{p.comunidad || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-surface-container-high text-on-surface-variant">
                        {p.tipo_seguro || 'SIS'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.triaje_prioridad ? (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold font-mono uppercase border ${
                            p.triaje_prioridad === 'I' || p.triaje_prioridad_color === 'rojo'
                              ? 'bg-error-container text-on-error-container border-error/30'
                              : p.triaje_prioridad === 'II' || p.triaje_prioridad_color === 'amarillo'
                              ? 'bg-[#fef3c7] text-[#92400e] border-[#b28600]/30'
                              : 'bg-tertiary-container text-on-tertiary-container border-tertiary/30'
                          }`}
                        >
                          P-{p.triaje_prioridad} {p.triaje_pa_sistolica ? `(${p.triaje_pa_sistolica}/${p.triaje_pa_diastolica})` : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] text-on-surface-variant font-mono">Sin triaje</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPatientId(p.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-primary cursor-pointer transition-colors"
                          title="Ver ficha e historial clínico"
                        >
                          Historial
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-primary hover:bg-on-primary-fixed-variant text-on-primary cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                          title="Editar filiación y datos clínicos de triaje"
                        >
                          <span className="material-symbols-outlined text-[13px]">edit</span>
                          <span>Editar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {lastPage > 1 && (
          <div className="px-6 py-3 border-t border-surface-container-high flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-xs font-mono border border-surface-container-high bg-surface-container hover:bg-surface-container-high text-on-surface disabled:opacity-40 cursor-pointer"
            >
              ← Anterior
            </button>
            <span className="text-xs font-mono text-on-surface-variant">
              Página {page} de {lastPage}
            </span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs font-mono border border-surface-container-high bg-surface-container hover:bg-surface-container-high text-on-surface disabled:opacity-40 cursor-pointer"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* Modal: Ver Historial / Ficha del Paciente */}
      {selectedPatientId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-container-high shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 text-on-surface">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">medical_information</span>
                <h2 className="text-base font-bold uppercase tracking-wider text-on-surface">
                  Ficha e Historial Clínico
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatientId(null)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {isLoadingDetail ? (
              <div className="p-8 text-center text-xs font-mono">Cargando ficha del paciente...</div>
            ) : patientDetail ? (
              <div className="space-y-4 text-xs">
                {/* Cabecera del paciente */}
                <div className="p-4 bg-surface-container border border-surface-container-high flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <div className="text-base font-black uppercase text-primary">
                      {patientDetail.apellidos}, {patientDetail.nombres}
                    </div>
                    <div className="text-xs font-mono text-secondary mt-0.5">
                      DNI: <strong>{patientDetail.dni}</strong> • Edad: {patientDetail.edad_calculada ?? '—'} años • Sexo: {patientDetail.sexo}
                    </div>
                    <div className="text-xs text-on-surface-variant mt-1">
                      Comunidad: {patientDetail.comunidad || 'Rumichaca'} • Idioma: {patientDetail.idioma_principal || 'Quechua'} • Tel: {patientDetail.celular || '—'}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <span className="px-2.5 py-1 text-xs font-mono font-bold bg-primary-container text-on-primary-container border border-primary/20">
                      SEGURO: {patientDetail.tipo_seguro || 'SIS'}
                    </span>
                  </div>
                </div>

                {/* Atenciones registradas */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-secondary mb-2">
                    Jornadas y Atenciones Previas ({patientDetail.atenciones?.length || 0})
                  </h3>
                  {patientDetail.atenciones && patientDetail.atenciones.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {patientDetail.atenciones.map((atn: any) => (
                        <div key={atn.id} className="p-3 bg-surface-container-low border border-surface-container-high text-xs">
                          <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                            <span className="font-bold text-primary">Turno #{atn.ticket_number}</span>
                            <span className="text-on-surface-variant">
                              {atn.arrival_time ? new Date(atn.arrival_time).toLocaleString() : '—'}
                            </span>
                          </div>
                          <div className="text-on-surface font-semibold">
                            Estado: <span className="uppercase text-tertiary">{atn.status}</span>
                            {atn.prioridad && (
                              <span className="ml-2 px-1.5 py-0.5 bg-surface-container font-mono text-[10px]">
                                Manchester: {atn.prioridad} ({atn.prioridad_color})
                              </span>
                            )}
                          </div>
                          {atn.temperatura_c && (
                            <div className="text-on-surface-variant text-[11px] mt-1 font-mono">
                              PA: {atn.presion_sistolica}/{atn.presion_diastolica} • T°: {atn.temperatura_c}°C • SpO2: {atn.saturacion_o2_pct}% • FC: {atn.frecuencia_cardiaca} lpm
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-container text-center text-on-surface-variant">
                      No registra atenciones en jornadas anteriores.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal: Editar Paciente y Constantes de Triaje */}
      {editModalOpen && editingPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-container-high shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 text-on-surface">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">person_edit</span>
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-on-surface">
                    Editar Ficha del Paciente &amp; Triaje
                  </h2>
                  <div className="text-[11px] text-on-surface-variant font-mono">
                    Paciente #{editingPatient.id} • DNI: {editingPatient.dni}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5 text-xs">
              {/* SECCIÓN 1: Identificación y Datos Personales */}
              <div className="p-4 bg-surface-container-low border border-surface-container-high space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-surface-container-high">
                  <span className="w-5 h-5 bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">1</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                    Identificación &amp; Datos Personales
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      DNI (8 dígitos) *
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      required
                      value={dni}
                      onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-10 px-3 bg-surface border border-surface-container-high text-sm font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Apellidos Completos *
                    </label>
                    <input
                      type="text"
                      required
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-surface-container-high text-sm uppercase focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-surface-container-high text-sm uppercase focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      F. Nacimiento *
                    </label>
                    <input
                      type="date"
                      required
                      value={fechaNac}
                      onChange={(e) => setFechaNac(e.target.value)}
                      className="w-full h-10 px-2 bg-surface border border-surface-container-high text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Edad Calc.
                    </label>
                    <div className="h-10 px-3 bg-surface-container flex items-center justify-between text-xs font-bold text-on-surface border border-surface-container-high">
                      <span>{calculateAge(fechaNac)}</span>
                      <span className="text-[10px] text-on-surface-variant font-normal">años</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Sexo *
                    </label>
                    <select
                      value={sexo}
                      onChange={(e) => setSexo(e.target.value as any)}
                      className="w-full h-10 px-2 bg-surface border border-surface-container-high text-xs focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Estado Civil
                    </label>
                    <select
                      value={estadoCivil}
                      onChange={(e) => setEstadoCivil(e.target.value)}
                      className="w-full h-10 px-2 bg-surface border border-surface-container-high text-xs focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="conviviente">Conviviente</option>
                      <option value="casado">Casado(a)</option>
                      <option value="soltero">Soltero(a)</option>
                      <option value="viudo">Viudo(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: Residencia y Contacto Comunitario */}
              <div className="p-4 bg-surface-container-low border border-surface-container-high space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-surface-container-high">
                  <span className="w-5 h-5 bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">2</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                    Residencia &amp; Cobertura
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Comunidad / Sector *
                    </label>
                    <select
                      value={comunidad}
                      onChange={(e) => setComunidad(e.target.value)}
                      className="w-full h-10 px-2 bg-surface border border-surface-container-high text-xs focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="rumichaca">Rumichaca (Sector Alto)</option>
                      <option value="ollantaytambo">Ollantaytambo (Willoq)</option>
                      <option value="marcas">Marcas - Huayllabamba</option>
                      <option value="urubamba">Urubamba Centro</option>
                      <option value="yanahuara">Yanahuara</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Móvil / WhatsApp (+51)
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. 984 312 809"
                      value={celular}
                      onChange={(e) => setCelular(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-surface-container-high text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Lengua Materna
                    </label>
                    <select
                      value={idioma}
                      onChange={(e) => setIdioma(e.target.value)}
                      className="w-full h-10 px-2 bg-surface border border-surface-container-high text-xs focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="quechua">Quechua Collao</option>
                      <option value="castellano">Castellano</option>
                      <option value="aimara">Aimara</option>
                      <option value="bilingue">Bilingüe</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Altitud Habitual (msnm)
                    </label>
                    <input
                      type="number"
                      value={altitud}
                      onChange={(e) => setAltitud(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-10 px-3 bg-surface border border-surface-container-high text-sm font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Traslado a pie
                    </label>
                    <select
                      value={tiempoViaje}
                      onChange={(e) => setTiempoViaje(e.target.value)}
                      className="w-full h-10 px-2 bg-surface border border-surface-container-high text-xs focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="30">Menos de 30 min</option>
                      <option value="60">30 min a 1 hora</option>
                      <option value="120">1 a 2 horas a pie</option>
                      <option value="180">Más de 2 horas a pie</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Seguro de Salud *
                    </label>
                    <select
                      value={seguro}
                      onChange={(e) => setSeguro(e.target.value)}
                      className="w-full h-10 px-2 bg-surface border border-surface-container-high text-xs focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="sis">SIS Gratuito Subsidiado</option>
                      <option value="essalud">EsSalud (Seguro Social)</option>
                      <option value="ninguno">Sin Seguro / No Afiliado</option>
                      <option value="privado">Privado / FFAA</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: Antecedentes, Alergias y Motivo */}
              <div className="p-4 bg-surface-container-low border border-surface-container-high space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-surface-container-high">
                  <span className="w-5 h-5 bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">3</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                    Antecedentes Crónicos &amp; Alergias
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-surface border border-surface-container-high cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hipertension}
                      onChange={(e) => setHipertension(e.target.checked)}
                      className="accent-primary"
                    />
                    <span className="text-[11px] font-medium text-on-surface">Hipertensión</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface border border-surface-container-high cursor-pointer">
                    <input
                      type="checkbox"
                      checked={diabetes}
                      onChange={(e) => setDiabetes(e.target.checked)}
                      className="accent-primary"
                    />
                    <span className="text-[11px] font-medium text-on-surface">Diabetes</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface border border-surface-container-high cursor-pointer">
                    <input
                      type="checkbox"
                      checked={asma}
                      onChange={(e) => setAsma(e.target.checked)}
                      className="accent-primary"
                    />
                    <span className="text-[11px] font-medium text-on-surface">Asma / EPOC</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface border border-surface-container-high cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anemia}
                      onChange={(e) => setAnemia(e.target.checked)}
                      className="accent-primary"
                    />
                    <span className="text-[11px] font-medium text-on-surface">Anemia</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface border border-surface-container-high cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gestante}
                      onChange={(e) => setGestante(e.target.checked)}
                      className="accent-primary"
                    />
                    <span className="text-[11px] font-medium text-on-surface">Gestante</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Alergias Medicamentosas
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Penicilina, Sulfas, AINEs..."
                      value={alergias}
                      onChange={(e) => setAlergias(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-surface-container-high text-xs text-error focus:outline-none focus:border-error"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Motivo / Molestia Principal
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Control general, dolor lumbar..."
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-surface-container-high text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: Constantes Vitales & Triaje Clínico */}
              <div className="p-4 bg-surface-container-low border border-surface-container-high space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-surface-container-high gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">4</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                      Constantes Vitales &amp; Triaje Clínico
                    </h3>
                  </div>

                  {canEditTriaje ? (
                    <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-tertiary-container text-on-tertiary-container flex items-center gap-1.5 border border-tertiary/40 self-start sm:self-auto">
                      <span className="material-symbols-outlined text-sm">lock_open</span>
                      Edición Habilitada (Rol: {user?.role === 'admin' ? 'Administrador' : 'Médico'})
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant flex items-center gap-1.5 border border-surface-container-high self-start sm:self-auto">
                      <span className="material-symbols-outlined text-sm">lock</span>
                      Solo Lectura (Modificación restringida a Médico o Administrador)
                    </span>
                  )}
                </div>

                {loadingTriaje && (
                  <div className="py-2 text-center text-xs font-mono text-primary animate-pulse">
                    Cargando constantes y registro de triaje...
                  </div>
                )}

                {/* Clasificación Manchester */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      Nivel de Prioridad Manchester
                    </label>
                    {!canEditTriaje && (
                      <span className="text-[10px] text-on-surface-variant italic">Solo visualización</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Prioridad I */}
                    <div
                      onClick={() => canEditTriaje && setTriajePrioridad('I')}
                      className={`p-3 border transition-all relative flex flex-col justify-between ${
                        triajePrioridad === 'I'
                          ? 'bg-surface border-error ring-2 ring-error shadow-xs'
                          : 'bg-surface-container border-surface-container-high'
                      } ${canEditTriaje ? 'cursor-pointer hover:border-error' : 'cursor-not-allowed opacity-85'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-error uppercase">Prioridad I</span>
                        <span className="material-symbols-outlined text-error text-lg">e911_emergency</span>
                      </div>
                      <div className="text-xs font-semibold text-on-surface">Emergencia (Rojo)</div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5">Reanimación inmediata (0 min)</div>
                    </div>

                    {/* Prioridad II */}
                    <div
                      onClick={() => canEditTriaje && setTriajePrioridad('II')}
                      className={`p-3 border transition-all relative flex flex-col justify-between ${
                        triajePrioridad === 'II'
                          ? 'bg-surface border-[#b28600] ring-2 ring-[#b28600] shadow-xs'
                          : 'bg-surface-container border-surface-container-high'
                      } ${canEditTriaje ? 'cursor-pointer hover:border-[#b28600]' : 'cursor-not-allowed opacity-85'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-[#b28600] uppercase">Prioridad II</span>
                        <span className="material-symbols-outlined text-[#b28600] text-lg">notification_important</span>
                      </div>
                      <div className="text-xs font-semibold text-on-surface">Urgencia Relativa (Amarillo)</div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5">Espera máx &lt; 15 min</div>
                    </div>

                    {/* Prioridad III */}
                    <div
                      onClick={() => canEditTriaje && setTriajePrioridad('III')}
                      className={`p-3 border transition-all relative flex flex-col justify-between ${
                        triajePrioridad === 'III'
                          ? 'bg-surface border-tertiary ring-2 ring-tertiary shadow-xs'
                          : 'bg-surface-container border-surface-container-high'
                      } ${canEditTriaje ? 'cursor-pointer hover:border-tertiary' : 'cursor-not-allowed opacity-85'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-tertiary uppercase">Prioridad III</span>
                        <span className="material-symbols-outlined text-tertiary text-lg">health_and_safety</span>
                      </div>
                      <div className="text-xs font-semibold text-on-surface">No Urgente (Verde)</div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5">Espera estándar &lt; 60 min</div>
                    </div>
                  </div>
                </div>

                {/* Rejilla de Signos Vitales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Presión Arterial */}
                  <div className="bg-surface p-3 border border-surface-container-high flex flex-col justify-between">
                    <div className="flex items-center justify-between text-on-surface-variant mb-1">
                      <span className="text-[11px] font-semibold uppercase">PA (Sist/Diast)</span>
                      <span className="material-symbols-outlined text-[15px]">blood_pressure</span>
                    </div>
                    <div className="my-1.5 flex items-baseline gap-1">
                      <input
                        type="number"
                        disabled={!canEditTriaje}
                        readOnly={!canEditTriaje}
                        placeholder="120"
                        value={triajePaSistolica}
                        onChange={(e) => setTriajePaSistolica(e.target.value)}
                        className={`w-14 font-mono font-bold text-base px-1.5 py-0.5 border ${
                          canEditTriaje
                            ? 'bg-surface border-surface-container-high focus:outline-none focus:border-primary'
                            : 'bg-surface-container/60 border-surface-container-high cursor-not-allowed text-on-surface'
                        }`}
                      />
                      <span className="font-bold text-secondary">/</span>
                      <input
                        type="number"
                        disabled={!canEditTriaje}
                        readOnly={!canEditTriaje}
                        placeholder="80"
                        value={triajePaDiastolica}
                        onChange={(e) => setTriajePaDiastolica(e.target.value)}
                        className={`w-14 font-mono font-bold text-base px-1.5 py-0.5 border ${
                          canEditTriaje
                            ? 'bg-surface border-surface-container-high focus:outline-none focus:border-primary'
                            : 'bg-surface-container/60 border-surface-container-high cursor-not-allowed text-on-surface'
                        }`}
                      />
                      <span className="text-[10px] text-secondary font-mono">mmHg</span>
                    </div>
                  </div>

                  {/* Frecuencia Cardíaca */}
                  <div className="bg-surface p-3 border border-surface-container-high flex flex-col justify-between">
                    <div className="flex items-center justify-between text-on-surface-variant mb-1">
                      <span className="text-[11px] font-semibold uppercase">Frec. Cardíaca</span>
                      <span className="material-symbols-outlined text-[15px]">cardiology</span>
                    </div>
                    <div className="my-1.5 flex items-baseline gap-1">
                      <input
                        type="number"
                        disabled={!canEditTriaje}
                        readOnly={!canEditTriaje}
                        placeholder="75"
                        value={triajeFc}
                        onChange={(e) => setTriajeFc(e.target.value)}
                        className={`w-20 font-mono font-bold text-base px-1.5 py-0.5 border ${
                          canEditTriaje
                            ? 'bg-surface border-surface-container-high focus:outline-none focus:border-primary'
                            : 'bg-surface-container/60 border-surface-container-high cursor-not-allowed text-on-surface'
                        }`}
                      />
                      <span className="text-[10px] text-secondary font-mono">lpm</span>
                    </div>
                  </div>

                  {/* Temperatura */}
                  <div className="bg-surface p-3 border border-surface-container-high flex flex-col justify-between">
                    <div className="flex items-center justify-between text-on-surface-variant mb-1">
                      <span className="text-[11px] font-semibold uppercase">Temperatura</span>
                      <span className="material-symbols-outlined text-[15px]">device_thermostat</span>
                    </div>
                    <div className="my-1.5 flex items-baseline gap-1">
                      <input
                        type="number"
                        step="0.1"
                        disabled={!canEditTriaje}
                        readOnly={!canEditTriaje}
                        placeholder="36.5"
                        value={triajeTemperatura}
                        onChange={(e) => setTriajeTemperatura(e.target.value)}
                        className={`w-20 font-mono font-bold text-base px-1.5 py-0.5 border ${
                          canEditTriaje
                            ? 'bg-surface border-surface-container-high focus:outline-none focus:border-primary'
                            : 'bg-surface-container/60 border-surface-container-high cursor-not-allowed text-on-surface'
                        }`}
                      />
                      <span className="text-[10px] text-secondary font-mono">°C</span>
                    </div>
                  </div>

                  {/* SpO2 */}
                  <div className="bg-surface p-3 border border-surface-container-high flex flex-col justify-between">
                    <div className="flex items-center justify-between text-on-surface-variant mb-1">
                      <span className="text-[11px] font-semibold uppercase">SpO2 (Altitud)</span>
                      <span className="material-symbols-outlined text-[15px]">air</span>
                    </div>
                    <div className="my-1.5 flex items-baseline gap-1">
                      <input
                        type="number"
                        disabled={!canEditTriaje}
                        readOnly={!canEditTriaje}
                        placeholder="95"
                        value={triajeSpo2}
                        onChange={(e) => setTriajeSpo2(e.target.value)}
                        className={`w-20 font-mono font-bold text-base px-1.5 py-0.5 border ${
                          canEditTriaje
                            ? 'bg-surface border-surface-container-high focus:outline-none focus:border-primary'
                            : 'bg-surface-container/60 border-surface-container-high cursor-not-allowed text-on-surface'
                        }`}
                      />
                      <span className="text-[10px] text-secondary font-mono">%</span>
                    </div>
                  </div>

                  {/* Frecuencia Respiratoria */}
                  <div className="bg-surface p-3 border border-surface-container-high flex flex-col justify-between">
                    <div className="flex items-center justify-between text-on-surface-variant mb-1">
                      <span className="text-[11px] font-semibold uppercase">Frec. Resp.</span>
                      <span className="material-symbols-outlined text-[15px]">lungs</span>
                    </div>
                    <div className="my-1.5 flex items-baseline gap-1">
                      <input
                        type="number"
                        disabled={!canEditTriaje}
                        readOnly={!canEditTriaje}
                        placeholder="18"
                        value={triajeFr}
                        onChange={(e) => setTriajeFr(e.target.value)}
                        className={`w-20 font-mono font-bold text-base px-1.5 py-0.5 border ${
                          canEditTriaje
                            ? 'bg-surface border-surface-container-high focus:outline-none focus:border-primary'
                            : 'bg-surface-container/60 border-surface-container-high cursor-not-allowed text-on-surface'
                        }`}
                      />
                      <span className="text-[10px] text-secondary font-mono">rpm</span>
                    </div>
                  </div>

                  {/* Glucosa */}
                  <div className="bg-surface p-3 border border-surface-container-high flex flex-col justify-between">
                    <div className="flex items-center justify-between text-on-surface-variant mb-1">
                      <span className="text-[11px] font-semibold uppercase">Glucosa</span>
                      <span className="material-symbols-outlined text-[15px]">water_drop</span>
                    </div>
                    <div className="my-1.5 flex items-baseline gap-1">
                      <input
                        type="number"
                        disabled={!canEditTriaje}
                        readOnly={!canEditTriaje}
                        placeholder="90"
                        value={triajeGlucosa}
                        onChange={(e) => setTriajeGlucosa(e.target.value)}
                        className={`w-20 font-mono font-bold text-base px-1.5 py-0.5 border ${
                          canEditTriaje
                            ? 'bg-surface border-surface-container-high focus:outline-none focus:border-primary'
                            : 'bg-surface-container/60 border-surface-container-high cursor-not-allowed text-on-surface'
                        }`}
                      />
                      <span className="text-[10px] text-secondary font-mono">mg/dL</span>
                    </div>
                  </div>

                  {/* Peso & Talla */}
                  <div className="bg-surface p-3 border border-surface-container-high flex flex-col justify-between">
                    <div className="flex items-center justify-between text-on-surface-variant mb-1">
                      <span className="text-[11px] font-semibold uppercase">Peso / Talla</span>
                      <span className="material-symbols-outlined text-[15px]">monitor_weight</span>
                    </div>
                    <div className="my-1.5 flex items-baseline gap-1 text-xs">
                      <input
                        type="number"
                        step="0.5"
                        disabled={!canEditTriaje}
                        readOnly={!canEditTriaje}
                        placeholder="68.0"
                        value={triajePeso}
                        onChange={(e) => setTriajePeso(e.target.value)}
                        className={`w-14 font-mono font-bold text-sm px-1 py-0.5 border ${
                          canEditTriaje
                            ? 'bg-surface border-surface-container-high focus:outline-none focus:border-primary'
                            : 'bg-surface-container/60 border-surface-container-high cursor-not-allowed text-on-surface'
                        }`}
                      />
                      <span className="text-[10px] text-secondary">kg /</span>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!canEditTriaje}
                        readOnly={!canEditTriaje}
                        placeholder="1.62"
                        value={triajeTalla}
                        onChange={(e) => setTriajeTalla(e.target.value)}
                        className={`w-14 font-mono font-bold text-sm px-1 py-0.5 border ${
                          canEditTriaje
                            ? 'bg-surface border-surface-container-high focus:outline-none focus:border-primary'
                            : 'bg-surface-container/60 border-surface-container-high cursor-not-allowed text-on-surface'
                        }`}
                      />
                      <span className="text-[10px] text-secondary">m</span>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-primary">
                      IMC: {triajeImc ? `${triajeImc} kg/m²` : '—'}
                    </div>
                  </div>

                  {/* Glasgow */}
                  <div className="bg-surface p-3 border border-surface-container-high flex flex-col justify-between">
                    <div className="flex items-center justify-between text-on-surface-variant mb-1">
                      <span className="text-[11px] font-semibold uppercase">Glasgow</span>
                      <span className="material-symbols-outlined text-[15px]">psychology</span>
                    </div>
                    <div className="my-1.5 flex items-baseline gap-1">
                      <input
                        type="number"
                        min={3}
                        max={15}
                        disabled={!canEditTriaje}
                        readOnly={!canEditTriaje}
                        placeholder="15"
                        value={triajeGlasgow}
                        onChange={(e) => setTriajeGlasgow(e.target.value)}
                        className={`w-20 font-mono font-bold text-base px-1.5 py-0.5 border ${
                          canEditTriaje
                            ? 'bg-surface border-surface-container-high focus:outline-none focus:border-primary'
                            : 'bg-surface-container/60 border-surface-container-high cursor-not-allowed text-on-surface'
                        }`}
                      />
                      <span className="text-[10px] text-secondary font-mono">/ 15</span>
                    </div>
                  </div>
                </div>

                {/* Observaciones de Triaje */}
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Observaciones &amp; Hallazgos de Triaje
                  </label>
                  <textarea
                    rows={2}
                    disabled={!canEditTriaje}
                    readOnly={!canEditTriaje}
                    placeholder="Sin observaciones particulares registradas en triaje..."
                    value={triajeObservaciones}
                    onChange={(e) => setTriajeObservaciones(e.target.value)}
                    className={`w-full p-2.5 text-xs text-on-surface border ${
                      canEditTriaje
                        ? 'bg-surface border-surface-container-high focus:border-primary focus:outline-none'
                        : 'bg-surface-container/60 border-surface-container-high cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-on-surface text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-semibold uppercase tracking-wider shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>Guardar Cambios del Paciente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
