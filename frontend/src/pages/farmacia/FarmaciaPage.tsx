import { useState, useMemo, useEffect } from 'react'
import {
  useFarmaciaMedicamentos,
  useFarmaciaAtenciones,
  useMedicos,
  useDispensarMedicamento,
  useBeneficiariosBuscar,
  type MedicamentoAdmin,
  type FarmaciaItemDispensar,
  type Beneficiario,
} from '../../api/hooks'
import { useAuthStore } from '../../store/authStore'
import { useFeatureStore } from '../../store/featureStore'
import { DescontarMedicamentoModal } from '../../components/farmacia/DescontarMedicamentoModal'
import { SignaturePad } from '../../components/farmacia/SignaturePad'
import { PhotoCapture } from '../../components/farmacia/PhotoCapture'
import { TicketModal, type TicketInfo } from '../../components/common/TicketModal'

export default function FarmaciaPage() {
  const campaignId = useAuthStore((s) => s.campaignId)
  const { farmaciaConfig, setFarmaciaConfig } = useFeatureStore()

  // Queries
  const { data: medicamentos = [], isLoading: loadingMeds, refetch: refetchMeds } = useFarmaciaMedicamentos(campaignId)
  const { data: atencionesCola = [], refetch: refetchCola } = useFarmaciaAtenciones(campaignId)
  const { data: medicosList = [] } = useMedicos()
  const dispensarMutation = useDispensarMedicamento()

  // Filtros del Grid
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVia, setSelectedVia] = useState<string>('todas')
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false)

  // Paciente & Doctor
  const [selectedAtencionId, setSelectedAtencionId] = useState<number | null>(null)
  const [selectedBeneficiarioId, setSelectedBeneficiarioId] = useState<number | null>(null)
  const [searchPacienteQuery, setSearchPacienteQuery] = useState('')
  const [isSearchPacienteOpen, setIsSearchPacienteOpen] = useState(false)
  const { data: searchPacientesData, isLoading: isSearchingPacientes } = useBeneficiariosBuscar(searchPacienteQuery)

  const [pacienteNombre, setPacienteNombre] = useState('')
  const [pacienteDni, setPacienteDni] = useState('')
  const [pacienteComunidad, setPacienteComunidad] = useState('')
  const [selectedMedicoId, setSelectedMedicoId] = useState<string>('')
  const [customMedicoNombre, setCustomMedicoNombre] = useState('')

  // Canasta de Dispensación
  const [canastaItems, setCanastaItems] = useState<FarmaciaItemDispensar[]>([])

  // Modal de Asignación / Descuento
  const [modalMed, setModalMed] = useState<MedicamentoAdmin | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Configuración de Cargo y Evidencia
  const [imprimirCargo, setImprimirCargo] = useState<boolean>(farmaciaConfig?.imprimirCargo ?? true)
  const [tipoCargo, setTipoCargo] = useState<'firma' | 'foto' | 'ambos' | 'ninguno'>(farmaciaConfig?.tipoCargo ?? 'firma')
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null)
  const [fotoBase64, setFotoBase64] = useState<string | null>(null)
  const [observaciones, setObservaciones] = useState<string>('')

  // Estado de Ticket Modal / Éxito
  const [ticketModalInfo, setTicketModalInfo] = useState<TicketInfo | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Sincronizar configuraciones guardadas
  useEffect(() => {
    if (farmaciaConfig) {
      if (typeof farmaciaConfig.imprimirCargo === 'boolean') setImprimirCargo(farmaciaConfig.imprimirCargo)
      if (farmaciaConfig.tipoCargo) setTipoCargo(farmaciaConfig.tipoCargo)
    }
  }, [farmaciaConfig])

  // Filtrado reactivo del grid de medicamentos por nombre o CUALQUIER columna
  const filteredMedicamentos = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    return medicamentos.filter((m) => {
      // Filtro de vía
      if (selectedVia !== 'todas' && m.via_administracion?.toLowerCase() !== selectedVia.toLowerCase()) {
        return false
      }
      // Filtro de solo stock
      if (onlyInStock && (m.stock_actual ?? 0) <= 0) {
        return false
      }
      // Búsqueda por cualquier columna
      if (!q) return true
      const matchCodigo = (m.codigo || '').toLowerCase().includes(q)
      const matchNombre = (m.nombre_generico || '').toLowerCase().includes(q)
      const matchComercial = (m.nombre_comercial || '').toLowerCase().includes(q)
      const matchConc = (m.concentracion || '').toLowerCase().includes(q)
      const matchForma = (m.forma_farmaceutica || '').toLowerCase().includes(q)
      const matchVia = (m.via_administracion || '').toLowerCase().includes(q)
      const matchStock = String(m.stock_actual ?? '').includes(q)
      const matchOrigen = (m.origen || '').toLowerCase().includes(q)

      return (
        matchCodigo ||
        matchNombre ||
        matchComercial ||
        matchConc ||
        matchForma ||
        matchVia ||
        matchStock ||
        matchOrigen
      )
    })
  }, [medicamentos, searchTerm, selectedVia, onlyInStock])

  // Vías únicas disponibles en el catálogo
  const availableVias = useMemo(() => {
    const set = new Set<string>()
    medicamentos.forEach((m) => {
      if (m.via_administracion) set.add(m.via_administracion)
    })
    return Array.from(set)
  }, [medicamentos])

  // Al seleccionar un paciente del padrón
  const handleSelectBeneficiario = (b: Beneficiario) => {
    setSelectedBeneficiarioId(b.id)
    setPacienteNombre(`${b.apellidos}, ${b.nombres}`)
    setPacienteDni(b.dni || '')
    setPacienteComunidad(b.comunidad || '')
    setSearchPacienteQuery('')
    setIsSearchPacienteOpen(false)
  }

  // Al seleccionar un paciente de la cola
  const handleSelectAtencionCola = (at: any) => {
    setSelectedAtencionId(at.atencion_id)
    if (at.beneficiario_id) {
      setSelectedBeneficiarioId(at.beneficiario_id)
    }
    setPacienteNombre(`${at.apellidos}, ${at.nombres}`)
    setPacienteDni(at.dni || '')
    setPacienteComunidad(at.comunidad || '')

    // Médico
    if (at.medico_id) {
      setSelectedMedicoId(String(at.medico_id))
      setCustomMedicoNombre('')
    } else if (at.medico_nombre) {
      setCustomMedicoNombre(at.medico_nombre)
      setSelectedMedicoId('externo')
    }

    // Si tiene receta precargada de consulta médica
    if (Array.isArray(at.receta) && at.receta.length > 0) {
      const itemsCargados: FarmaciaItemDispensar[] = []
      at.receta.forEach((r: any) => {
        // Encontrar en catálogo por ID o por nombre
        const found = medicamentos.find(
          (m) => (r.medicamento_id && m.id === r.medicamento_id) || m.nombre_generico.toLowerCase() === (r.nombre || '').toLowerCase()
        )
        if (found) {
          itemsCargados.push({
            medicamento_id: found.id,
            nombre: found.nombre_generico,
            concentracion: found.concentracion || undefined,
            forma: found.forma_farmaceutica || undefined,
            via: found.via_administracion || undefined,
            cantidad: parseInt(r.cantidad) || 1,
            dosis: r.dosis || '',
            indicaciones: r.frecuencia || r.indicaciones || '',
          })
        }
      })
      if (itemsCargados.length > 0) {
        setCanastaItems(itemsCargados)
      }
    }
  }

  // Abrir modal de asignación al hacer clic en cualquier columna del grid
  const handleRowClick = (m: MedicamentoAdmin) => {
    setModalMed(m)
    setIsModalOpen(true)
  }

  // Asignar o actualizar medicamento en la canasta de entrega
  const handleAddItemToCanasta = (item: FarmaciaItemDispensar) => {
    setCanastaItems((prev) => {
      const existingIdx = prev.findIndex((p) => p.medicamento_id === item.medicamento_id)
      if (existingIdx >= 0) {
        const copy = [...prev]
        copy[existingIdx] = item
        return copy
      }
      return [...prev, item]
    })
  }

  // Quitar medicamento de la canasta
  const handleRemoveCanastaItem = (medId: number) => {
    setCanastaItems((prev) => prev.filter((p) => p.medicamento_id !== medId))
  }

  // Actualizar cantidad directa en la canasta
  const handleUpdateCanastaCantidad = (medId: number, delta: number) => {
    const medRef = medicamentos.find((m) => m.id === medId)
    const maxStock = medRef?.stock_actual ?? 9999

    setCanastaItems((prev) =>
      prev
        .map((item) => {
          if (item.medicamento_id === medId) {
            const nextCant = Math.max(1, Math.min(maxStock, item.cantidad + delta))
            return { ...item, cantidad: nextCant }
          }
          return item
        })
        .filter((item) => item.cantidad > 0)
    )
  }

  // Resolver nombre de médico efectivo
  const effectiveMedicoName = useMemo(() => {
    if (selectedMedicoId === 'externo' || !selectedMedicoId) {
      return customMedicoNombre.trim() || 'Médico Prescriptor de Receta'
    }
    const found = medicosList.find((m) => String(m.id) === selectedMedicoId)
    return found ? `Dr. ${found.name} ${found.apellidos}` : customMedicoNombre.trim() || 'Médico Asignado'
  }, [selectedMedicoId, customMedicoNombre, medicosList])

  // Despachar / Dispensar y descontar stock en BD
  const handleConfirmDispensar = async () => {
    if (!pacienteNombre.trim()) {
      alert('Por favor ingrese o seleccione un paciente.')
      return
    }
    if (canastaItems.length === 0) {
      alert('Debe asignar al menos un medicamento a la receta para dispensar.')
      return
    }

    // Validar evidencia de cargo según configuración
    if ((tipoCargo === 'firma' || tipoCargo === 'ambos') && !firmaBase64) {
      if (!window.confirm('No se ha registrado la firma del paciente en pantalla. ¿Desea continuar con la entrega sin firma digital?')) {
        return
      }
    }
    if ((tipoCargo === 'foto' || tipoCargo === 'ambos') && !fotoBase64) {
      if (!window.confirm('No se ha adjuntado una fotografía de evidencia. ¿Desea continuar con la entrega sin foto?')) {
        return
      }
    }

    try {
      const res = await dispensarMutation.mutateAsync({
        campaign_id: campaignId ?? 1,
        atencion_id: selectedAtencionId,
        beneficiario_id: selectedBeneficiarioId || undefined,
        paciente_nombre: pacienteNombre.trim(),
        paciente_dni: pacienteDni.trim() || undefined,
        medico_id: selectedMedicoId && selectedMedicoId !== 'externo' ? parseInt(selectedMedicoId) : null,
        medico_nombre: effectiveMedicoName,
        items: canastaItems,
        modalidad_cargo: tipoCargo,
        firma_base64: firmaBase64,
        foto_url: fotoBase64,
        imprimir_cargo: imprimirCargo,
        observaciones: observaciones.trim() || undefined,
      })

      // Generar ticket info para impresión
      const ticketInfo: TicketInfo = {
        ticket: `FAR-${String(res.dispensacion_id || Date.now()).slice(-4)}`,
        hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        paciente: pacienteNombre,
        dni: pacienteDni || '---',
        comunidad: pacienteComunidad || 'Comunidad Rural',
        especialidad: 'FARMACIA & DISPENSACIÓN',
        consultorio: 'Farmacia de Campaña',
        medico: effectiveMedicoName,
      }

      setSuccessToast(`Dispensación #${res.dispensacion_id} completada exitosamente. Stock descontado en la BD.`)
      setTimeout(() => setSuccessToast(null), 4000)

      if (imprimirCargo) {
        setTicketModalInfo(ticketInfo)
      }

      // Limpiar formulario de atención
      setCanastaItems([])
      setSelectedAtencionId(null)
      setSelectedBeneficiarioId(null)
      setSearchPacienteQuery('')
      setPacienteNombre('')
      setPacienteDni('')
      setPacienteComunidad('')
      setFirmaBase64(null)
      setFotoBase64(null)
      setObservaciones('')

      // Recargar stock y cola en vivo
      refetchMeds()
      refetchCola()
    } catch (err: any) {
      alert(`Error al dispensar medicamentos: ${err.response?.data?.message || err.message}`)
    }
  }

  // Conmutador rápido de configuración
  const handleToggleImpresion = (val: boolean) => {
    setImprimirCargo(val)
    setFarmaciaConfig({ imprimirCargo: val })
  }

  const handleChangeTipoCargo = (val: 'firma' | 'foto' | 'ambos' | 'ninguno') => {
    setTipoCargo(val)
    setFarmaciaConfig({ tipoCargo: val })
  }

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Toast Notificación */}
      {successToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white px-5 py-3 shadow-xl border border-emerald-400 flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider">Entrega Registrada</div>
            <div className="text-xs text-white/95">{successToast}</div>
          </div>
          <button onClick={() => setSuccessToast(null)} className="ml-3 text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header Contextual */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-5 border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-primary-container text-on-primary-fixed">
              FAR-01
            </span>
            <span className="px-2 py-0.5 text-[11px] font-medium bg-surface-container text-on-surface-variant flex items-center gap-1.5 border border-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Dispensación de Fármacos &amp; Control de Stock
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-on-surface">
            Farmacia de Campaña <span className="font-semibold text-primary">&amp; Entrega de Recetas</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Asigne medicamentos al paciente, descuente del vademécum en tiempo real y capture la firma o foto de cargo.
          </p>
        </div>

        {/* Controles de Configuración Rápida en Cabecera */}
        <div className="flex flex-wrap items-center gap-3 bg-surface p-2.5 border border-surface-container-high shadow-2xs">
          {/* Switch de Impresión */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-on-surface select-none pr-3 border-r border-surface-container-high">
            <input
              type="checkbox"
              checked={imprimirCargo}
              onChange={(e) => handleToggleImpresion(e.target.checked)}
              className="accent-primary h-4 w-4 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">print</span>
              <span>Imprimir Cargo</span>
            </span>
          </label>

          {/* Selector de Evidencia / Cargo */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Evidencia:</span>
            <select
              value={tipoCargo}
              onChange={(e) => handleChangeTipoCargo(e.target.value as any)}
              className="h-8 px-2 bg-surface-container-low border border-surface-container-highest text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="firma">✍️ Firma en Pantalla</option>
              <option value="foto">📷 Foto de Entrega</option>
              <option value="ambos">✍️ + 📷 Firma y Foto</option>
              <option value="ninguno">🚫 Sin Evidencia (Rápido)</option>
            </select>
          </div>
        </div>
      </div>

      {/* BLOQUE SUPERIOR: CONTEXTO DEL PACIENTE Y DOCTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
        {/* Paciente */}
        <div className="lg:col-span-7 bg-surface p-4 border border-surface-container-high shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-surface-container-high pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">person</span>
              <span>1. Paciente a Atender</span>
            </span>
            {(selectedAtencionId || selectedBeneficiarioId || pacienteNombre || pacienteDni) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAtencionId(null)
                  setSelectedBeneficiarioId(null)
                  setSearchPacienteQuery('')
                  setPacienteNombre('')
                  setPacienteDni('')
                  setPacienteComunidad('')
                  setCanastaItems([])
                }}
                className="text-[11px] text-error hover:underline cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">close</span>
                Limpiar Paciente
              </button>
            )}
          </div>

          {/* BUSCADOR PREDICTIVO EN PADRÓN (DNI O APELLIDOS / NOMBRES) */}
          <div className="relative mb-3">
            <label className="block text-[11px] font-bold uppercase text-primary mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">person_search</span>
              <span>Buscar en Padrón de Pacientes (por DNI o Apellidos / Nombres)</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-primary text-base select-none pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Escriba DNI o Apellidos / Nombres para autocompletar..."
                value={searchPacienteQuery}
                onChange={(e) => {
                  setSearchPacienteQuery(e.target.value)
                  setIsSearchPacienteOpen(true)
                }}
                onFocus={() => {
                  if (searchPacienteQuery.trim().length >= 1) setIsSearchPacienteOpen(true)
                }}
                className="w-full h-9 pl-9 pr-8 text-xs bg-surface-container-low border border-primary/40 focus:border-primary text-on-surface focus:outline-none placeholder:text-on-surface-variant/60 font-medium transition-all"
              />
              {searchPacienteQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchPacienteQuery('')
                    setIsSearchPacienteOpen(false)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Dropdown flotante de resultados predictivos */}
            {isSearchPacienteOpen && searchPacienteQuery.trim().length >= 1 && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsSearchPacienteOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-surface border border-surface-container-high shadow-xl max-h-60 overflow-y-auto rounded-none">
                  {isSearchingPacientes && (
                    <div className="p-3 text-xs text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm animate-spin text-primary">progress_activity</span>
                      Buscando en padrón de pacientes...
                    </div>
                  )}
                  {!isSearchingPacientes && (!searchPacientesData?.data || searchPacientesData.data.length === 0) && (
                    <div className="p-3 text-xs text-on-surface-variant">
                      No se encontraron pacientes para &quot;{searchPacienteQuery}&quot;. Puede completar los datos manualmente abajo.
                    </div>
                  )}
                  {!isSearchingPacientes && searchPacientesData?.data && searchPacientesData.data.length > 0 && (
                    <div className="divide-y divide-surface-container-high">
                      {searchPacientesData.data.map((ben) => {
                        const hasNoDni = !ben.dni || ben.dni.trim() === ''
                        return (
                          <button
                            key={ben.id}
                            type="button"
                            onClick={() => handleSelectBeneficiario(ben)}
                            className="w-full text-left px-3 py-2 hover:bg-surface-container transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer group"
                          >
                            <div>
                              <div className="font-semibold text-on-surface group-hover:text-primary">
                                {ben.apellidos}, {ben.nombres}
                              </div>
                              <div className="text-[11px] text-on-surface-variant flex items-center gap-2 mt-0.5">
                                {hasNoDni ? (
                                  <span className="px-1.5 py-0.2 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-mono text-[10px] rounded-xs font-semibold">
                                    ⚠️ Sin DNI
                                  </span>
                                ) : (
                                  <span className="font-mono text-[11px] font-semibold text-primary">
                                    DNI: {ben.dni}
                                  </span>
                                )}
                                {ben.comunidad && <span>• {ben.comunidad}</span>}
                                {ben.edad_calculada ? <span>• {ben.edad_calculada} años</span> : null}
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                              check_circle
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Cartel de vinculación con Padrón */}
          {selectedBeneficiarioId && (
            <div className="mb-3 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                <span>Paciente Vinculado al Padrón (#ID: {selectedBeneficiarioId})</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBeneficiarioId(null)}
                className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Desvincular
              </button>
            </div>
          )}

          {/* Cola Rápida de Farmacia (si hay pacientes con recetas pendientes) */}
          {atencionesCola.length > 0 && (
            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">
                Pacientes en Espera / Recetas Emitidas ({atencionesCola.length})
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1.5">
                {atencionesCola.slice(0, 8).map((at) => (
                  <button
                    key={at.atencion_id}
                    type="button"
                    onClick={() => handleSelectAtencionCola(at)}
                    className={`px-3 py-1.5 border text-left shrink-0 cursor-pointer transition-colors ${selectedAtencionId === at.atencion_id
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container-high'
                      }`}
                  >
                    <div className="text-xs font-bold truncate max-w-[140px]">
                      {at.apellidos}, {at.nombres}
                    </div>
                    <div className="text-[10px] opacity-85 font-mono">
                      DNI: {at.dni || '---'} {at.receta?.length ? `• ${at.receta.length} meds` : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formulario de Datos del Paciente */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-8">
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Apellidos y Nombres *
              </label>
              <input
                type="text"
                placeholder="Nombre completo del paciente"
                value={pacienteNombre}
                onChange={(e) => setPacienteNombre(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-surface-container-low border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                DNI / Documento
              </label>
              <input
                type="text"
                placeholder="8 dígitos"
                value={pacienteDni}
                onChange={(e) => setPacienteDni(e.target.value)}
                className="w-full h-9 px-3 text-xs font-mono bg-surface-container-low border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Doctor Prescriptor */}
        <div className="lg:col-span-5 bg-surface p-4 border border-surface-container-high shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-surface-container-high pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">stethoscope</span>
              <span>2. Médico Prescriptor de la Receta *</span>
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                Seleccionar Médico de la Campaña:
              </label>
              <select
                value={selectedMedicoId}
                onChange={(e) => {
                  setSelectedMedicoId(e.target.value)
                  if (e.target.value !== 'externo') setCustomMedicoNombre('')
                }}
                className="w-full h-9 px-3 text-xs bg-surface-container-low border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="">-- Seleccionar Médico Registrado --</option>
                {medicosList.map((m) => (
                  <option key={m.id} value={m.id}>
                    Dr. {m.name} {m.apellidos} {m.cmp_code ? `(CMP: ${m.cmp_code})` : ''}
                  </option>
                ))}
                <option value="externo">✍️ Otro Médico / Receta Externa</option>
              </select>
            </div>

            {(selectedMedicoId === 'externo' || !selectedMedicoId) && (
              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                  Nombre del Médico / Establecimiento de Salud:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Dr. Carlos Fernández / C.S. Urubamba"
                  value={customMedicoNombre}
                  onChange={(e) => setCustomMedicoNombre(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-surface-container-low border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BLOQUE PRINCIPAL: CATÁLOGO EN GRID (IZQUIERDA) Y CANASTA DE ENTREGA (DERECHA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* COLUMNA IZQUIERDA: GRID DE MEDICAMENTOS (7 COLUMNAS) */}
        <div className="lg:col-span-7 bg-surface border border-surface-container-high p-4 shadow-xs">
          {/* Cabecera del Grid y Búsqueda */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container-high mb-3">
            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                <span>CATÁLOGO ACTUAL</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-primary-container text-on-primary-container">
                  {filteredMedicamentos.length} medicamentos
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Haga clic en cualquier fila o columna para abrir el modal y descontar stock.
              </p>
            </div>

            {/* Buscador reactivo por cualquier columna */}
            <div className="relative sm:w-64">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-base pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, código, forma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs bg-surface-container-low border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none font-mono"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-on-surface-variant hover:text-on-surface text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filtros Rápidos */}
          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
            <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Vía:</span>
            <button
              type="button"
              onClick={() => setSelectedVia('todas')}
              className={`px-2 py-0.5 text-[11px] font-mono border cursor-pointer ${selectedVia === 'todas'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-surface-container-highest'
                }`}
            >
              Todas
            </button>
            {availableVias.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSelectedVia(v)}
                className={`px-2 py-0.5 text-[11px] font-mono border cursor-pointer uppercase ${selectedVia === v
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-surface-container-highest'
                  }`}
              >
                {v}
              </button>
            ))}

            <label className="ml-auto flex items-center gap-1.5 text-[11px] cursor-pointer text-on-surface-variant select-none">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="accent-primary h-3.5 w-3.5 cursor-pointer"
              />
              <span>Solo con stock</span>
            </label>
          </div>

          {/* Grid Tabular con diseño exacto al screenshot */}
          <div className="overflow-x-auto max-h-[540px] overflow-y-auto border border-surface-container-highest">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-container-high text-on-surface font-semibold text-[11px] uppercase tracking-wider sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3 border-b border-surface-container-highest">CÓDIGO</th>
                  <th className="py-2.5 px-3 border-b border-surface-container-highest">MEDICAMENTO</th>
                  <th className="py-2.5 px-3 border-b border-surface-container-highest">CONCENTRACIÓN</th>
                  <th className="py-2.5 px-3 border-b border-surface-container-highest">FORMA</th>
                  <th className="py-2.5 px-3 border-b border-surface-container-highest">VÍA</th>
                  <th className="py-2.5 px-3 border-b border-surface-container-highest text-right">STOCK</th>
                  <th className="py-2.5 px-3 border-b border-surface-container-highest text-right">MÍN.</th>
                  <th className="py-2.5 px-3 border-b border-surface-container-highest text-center">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high bg-surface">
                {loadingMeds ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-on-surface-variant">
                      Cargando catálogo de medicamentos...
                    </td>
                  </tr>
                ) : filteredMedicamentos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-on-surface-variant">
                      No se encontraron medicamentos coincidentes con los filtros.
                    </td>
                  </tr>
                ) : (
                  filteredMedicamentos.map((m) => {
                    const isOutOfStock = (m.stock_actual ?? 0) <= 0
                    const isLowStock = (m.stock_actual ?? 0) <= (m.stock_minimo || 10) && !isOutOfStock
                    const inCanasta = canastaItems.find((ci) => ci.medicamento_id === m.id)

                    return (
                      <tr
                        key={m.id}
                        onClick={() => handleRowClick(m)}
                        className={`transition-colors cursor-pointer group ${inCanasta
                          ? 'bg-primary-container/20 hover:bg-primary-container/30'
                          : isOutOfStock
                            ? 'bg-surface-container-low opacity-60 hover:bg-surface-container'
                            : 'hover:bg-primary/5'
                          }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                          {m.codigo || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-on-surface">
                          <div>{m.nombre_generico}</div>
                          {m.nombre_comercial && (
                            <div className="text-[10px] text-primary font-normal">{m.nombre_comercial}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                          {m.concentracion || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-on-surface-variant capitalize whitespace-nowrap">
                          {m.forma_farmaceutica}
                        </td>
                        <td className="py-2.5 px-3 text-on-surface-variant capitalize whitespace-nowrap">
                          {m.via_administracion}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right whitespace-nowrap">
                          <span
                            className={
                              isOutOfStock
                                ? 'text-error font-extrabold'
                                : isLowStock
                                  ? 'text-amber-500 font-extrabold'
                                  : 'text-on-surface'
                            }
                          >
                            {m.stock_actual ?? 0}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-on-surface-variant text-right whitespace-nowrap">
                          {m.stock_minimo ?? 10}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {inCanasta ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-primary text-on-primary">
                              {inCanasta.cantidad} en receta
                            </span>
                          ) : (
                            <span className="text-[11px] text-primary group-hover:underline font-semibold flex items-center justify-center gap-0.5">
                              <span>Asignar</span>
                              <span className="material-symbols-outlined text-xs">add</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA: CANASTA DE ENTREGA, EVIDENCIA (FIRMA/FOTO) Y CONFIRMACIÓN (5 COLUMNAS) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Canasta de Medicamentos Seleccionados */}
          <div className="bg-surface border border-surface-container-high p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-surface-container-high">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">shopping_bag</span>
                <span>Medicamentos a Entregar ({canastaItems.length})</span>
              </span>
              {canastaItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCanastaItems([])}
                  className="text-[11px] text-error hover:underline cursor-pointer"
                >
                  Vaciar Todo
                </button>
              )}
            </div>

            {canastaItems.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-surface-container-highest p-4 text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-3xl mb-1 text-on-surface-variant/60 block">
                  medication
                </span>
                <p className="font-semibold text-on-surface">No hay medicamentos asignados a esta receta</p>
                <p className="text-[11px] mt-1 text-on-surface-variant">
                  Haga clic en cualquier fila del catálogo a la izquierda para agregar medicamentos y descontar stock.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {canastaItems.map((item) => {
                  const medData = medicamentos.find((m) => m.id === item.medicamento_id)
                  const remanente = (medData?.stock_actual ?? 0) - item.cantidad

                  return (
                    <div
                      key={item.medicamento_id}
                      className="p-2.5 bg-surface-container-low border border-surface-container-high flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-on-surface truncate">
                          {item.nombre} {item.concentracion ? `• ${item.concentracion}` : ''}
                        </div>
                        <div className="text-[10px] text-on-surface-variant font-mono">
                          {item.forma} • Stock restante: <span className="font-bold text-primary">{remanente}</span>
                        </div>
                        {item.dosis && (
                          <div className="text-[10px] text-on-surface mt-0.5">
                            <strong>Dosis:</strong> {item.dosis}
                          </div>
                        )}
                        {item.indicaciones && (
                          <div className="text-[10px] text-on-surface-variant truncate">
                            <strong>Ind:</strong> {item.indicaciones}
                          </div>
                        )}
                      </div>

                      {/* Contador de Cantidad */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateCanastaCantidad(item.medicamento_id, -1)}
                          className="w-6 h-6 bg-surface-container border border-surface-container-highest hover:bg-surface-container-high flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-sm text-primary">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCanastaCantidad(item.medicamento_id, +1)}
                          className="w-6 h-6 bg-surface-container border border-surface-container-highest hover:bg-surface-container-high flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCanastaItem(item.medicamento_id)}
                          className="p-1 text-on-surface-variant hover:text-error ml-1 cursor-pointer"
                          title="Quitar de la receta"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Área de Evidencia / Cargo de Recepción */}
          <div className="bg-surface border border-surface-container-high p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">verified</span>
                <span>3. Cargo de Entrega &amp; Recepción</span>
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-surface-container-high text-on-surface-variant">
                Modo: {tipoCargo}
              </span>
            </div>

            {/* Firma digital */}
            {(tipoCargo === 'firma' || tipoCargo === 'ambos') && (
              <SignaturePad onSignatureChange={setFirmaBase64} />
            )}

            {/* Foto de evidencia */}
            {(tipoCargo === 'foto' || tipoCargo === 'ambos') && (
              <PhotoCapture onPhotoChange={setFotoBase64} />
            )}

            {tipoCargo === 'ninguno' && (
              <div className="p-3 bg-surface-container-low border border-surface-container-high text-xs text-on-surface-variant">
                <p>
                  <strong>Modo de entrega rápida activo:</strong> No se solicitará firma ni fotografía digital. Los medicamentos se entregarán directamente registrando el usuario dispensador en la auditoría.
                </p>
              </div>
            )}

            {/* Observaciones opcionales */}
            <div>
              <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                Observaciones de la Dispensación (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ej. Se entrega a la madre del paciente / Carnet SIS verificado"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full h-8 px-3 text-xs bg-surface-container-low border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            {/* Checkbox de Impresión */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface select-none pt-1">
              <input
                type="checkbox"
                checked={imprimirCargo}
                onChange={(e) => handleToggleImpresion(e.target.checked)}
                className="accent-primary h-4 w-4 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary">print</span>
                <span>Imprimir Comprobante de Cargo al Dispensar</span>
              </span>
            </label>

            {/* Botón Principal de Dispensación */}
            <button
              type="button"
              disabled={dispensarMutation.isPending || canastaItems.length === 0 || !pacienteNombre.trim()}
              onClick={handleConfirmDispensar}
              className="w-full h-12 bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {dispensarMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Descontando Stock y Registrando Cargo...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">inventory</span>
                  <span>Dispensar y Descontar Stock ({canastaItems.reduce((acc, c) => acc + c.cantidad, 0)} unidades)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Descuento de Stock por Medicamento */}
      <DescontarMedicamentoModal
        isOpen={isModalOpen}
        medicamento={modalMed}
        onClose={() => {
          setIsModalOpen(false)
          setModalMed(null)
        }}
        onConfirm={handleAddItemToCanasta}
      />

      {/* Modal de Impresión de Cargo / Ticket Térmico */}
      <TicketModal
        isOpen={!!ticketModalInfo}
        onClose={() => setTicketModalInfo(null)}
        info={ticketModalInfo}
      />
    </div>
  )
}
