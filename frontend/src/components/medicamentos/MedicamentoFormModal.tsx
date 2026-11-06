import { useState, useEffect } from 'react'
import type { MedicamentoAdmin } from '../../api/hooks'
import { useCreateMedicamento, useUpdateMedicamento } from '../../api/hooks'
import { useFeatureStore } from '../../store/featureStore'
import { saveSystemSettings } from '../../services/settingsService'

const FORMAS_FARMACEUTICAS = [
  { value: 'tableta', label: 'Tableta / Comprimido' },
  { value: 'capsula', label: 'Cápsula' },
  { value: 'jarabe', label: 'Jarabe / Suspensión' },
  { value: 'inyectable', label: 'Inyectable / Ampolla' },
  { value: 'crema', label: 'Crema / Pomada' },
  { value: 'ovulo', label: 'Óvulo' },
  { value: 'solucion', label: 'Solución / Gotas' },
  { value: 'otro', label: 'Otro' },
]

const VIAS_ADMINISTRACION = [
  { value: 'oral', label: 'Oral (V.O.)' },
  { value: 'IM', label: 'Intramuscular (I.M.)' },
  { value: 'IV', label: 'Intravenosa / Endovenosa (I.V.)' },
  { value: 'topica', label: 'Tópica / Dérmica' },
  { value: 'inhalada', label: 'Inhalada' },
  { value: 'sublingual', label: 'Sublingual' },
  { value: 'otro', label: 'Otra' },
]

interface MedicamentoFormModalProps {
  isOpen: boolean
  onClose: () => void
  campaignId: number
  medicamentoToEdit: MedicamentoAdmin | null
  onSaved?: (msg: string) => void
}

export function MedicamentoFormModal({
  isOpen,
  onClose,
  campaignId,
  medicamentoToEdit,
  onSaved,
}: MedicamentoFormModalProps) {
  const isEditing = Boolean(medicamentoToEdit)
  const createMutation = useCreateMedicamento()
  const updateMutation = useUpdateMedicamento()

  const {
    medicamentosClasificaciones,
    medicamentosUsos,
    addMedicamentoClasificacion,
    addMedicamentoUso,
  } = useFeatureStore()

  const [codigo, setCodigo] = useState('')
  const [clasificacion, setClasificacion] = useState('')
  const [uso, setUso] = useState('Uso General')
  const [nombreGenerico, setNombreGenerico] = useState('')
  const [nombreComercial, setNombreComercial] = useState('')
  const [concentracion, setConcentracion] = useState('')
  const [formaFarmaceutica, setFormaFarmaceutica] = useState('tableta')
  const [viaAdministracion, setViaAdministracion] = useState('oral')
  const [stockActual, setStockActual] = useState(0)
  const [stockMinimo, setStockMinimo] = useState(10)
  const [activo, setActivo] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Control de adición dinámica de ítems a la Clasificación y Uso
  const [showAddClasif, setShowAddClasif] = useState(false)
  const [newClasifInput, setNewClasifInput] = useState('')
  const [showAddUso, setShowAddUso] = useState(false)
  const [newUsoInput, setNewUsoInput] = useState('')

  useEffect(() => {
    if (medicamentoToEdit) {
      setCodigo(medicamentoToEdit.codigo || '')
      setClasificacion(medicamentoToEdit.clasificacion || '')
      setUso(medicamentoToEdit.uso || 'Uso General')
      setNombreGenerico(medicamentoToEdit.nombre_generico || '')
      setNombreComercial(medicamentoToEdit.nombre_comercial || '')
      setConcentracion(medicamentoToEdit.concentracion || '')
      setFormaFarmaceutica(medicamentoToEdit.forma_farmaceutica || 'tableta')
      setViaAdministracion(medicamentoToEdit.via_administracion || 'oral')
      setStockActual(medicamentoToEdit.stock_actual ?? 0)
      setStockMinimo(medicamentoToEdit.stock_minimo ?? 10)
      setActivo(Number(medicamentoToEdit.activo) === 1 || Boolean(medicamentoToEdit.activo))
    } else {
      setCodigo('')
      setClasificacion(medicamentosClasificaciones[0] || 'Analgésico')
      setUso('Uso General')
      setNombreGenerico('')
      setNombreComercial('')
      setConcentracion('')
      setFormaFarmaceutica('tableta')
      setViaAdministracion('oral')
      setStockActual(0)
      setStockMinimo(10)
      setActivo(true)
    }
    setErrorMsg(null)
    setShowAddClasif(false)
    setShowAddUso(false)
  }, [medicamentoToEdit, isOpen, medicamentosClasificaciones])

  if (!isOpen) return null

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleAddNewClasif = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = newClasifInput.trim()
    if (!clean) return
    addMedicamentoClasificacion(clean)
    setClasificacion(clean)
    setNewClasifInput('')
    setShowAddClasif(false)
    const updated = Array.from(new Set([...medicamentosClasificaciones, clean]))
    await saveSystemSettings({ medicamentosClasificaciones: updated })
  }

  const handleAddNewUso = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = newUsoInput.trim()
    if (!clean) return
    addMedicamentoUso(clean)
    setUso(clean)
    setNewUsoInput('')
    setShowAddUso(false)
    const updated = Array.from(new Set([...medicamentosUsos, clean]))
    await saveSystemSettings({ medicamentosUsos: updated })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const gen = nombreGenerico.trim()
    if (!gen) {
      setErrorMsg('El nombre genérico del medicamento es obligatorio.')
      return
    }

    try {
      const payload = {
        campaign_id: campaignId,
        codigo: codigo.trim() || undefined,
        clasificacion: clasificacion.trim() || undefined,
        uso: uso.trim() || undefined,
        nombre_generico: gen,
        nombre_comercial: nombreComercial.trim() || undefined,
        concentracion: concentracion.trim() || undefined,
        forma_farmaceutica: formaFarmaceutica,
        via_administracion: viaAdministracion,
        stock_actual: Math.max(0, Number(stockActual) || 0),
        stock_minimo: Math.max(0, Number(stockMinimo) || 0),
        activo: activo ? 1 : 0,
      }

      if (isEditing && medicamentoToEdit) {
        await updateMutation.mutateAsync({
          id: medicamentoToEdit.id,
          ...payload,
        })
        onSaved?.(`Medicamento "${gen}" actualizado correctamente.`)
      } else {
        await createMutation.mutateAsync(payload)
        onSaved?.(`Medicamento "${gen}" creado exitosamente en el catálogo.`)
      }
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Error al guardar el medicamento.'
      setErrorMsg(msg)
    }
  }

  const inputCls =
    'w-full h-9 px-3 bg-surface-container-low text-xs border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none transition-colors'
  const labelCls = 'block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1'

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border-2 border-primary shadow-2xl w-full max-w-2xl p-6 text-on-surface animate-fade-in my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary/10 text-primary flex items-center justify-center rounded">
              <span className="material-symbols-outlined text-xl">
                {isEditing ? 'edit_note' : 'add_circle'}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide text-on-surface">
                {isEditing ? 'Editar Medicamento de Campaña' : 'Nuevo Medicamento de Campaña'}
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                {isEditing
                  ? 'Modifique la clasificación clínica, especificaciones y stock'
                  : 'Ingrese un nuevo fármaco al vademécum de esta campaña médica'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 text-xs bg-error-container text-on-error-container border border-error/30 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Fila 1: CLASIFICACIÓN (Para qué es) y CÓDIGO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-surface-container-low border border-surface-container-high">
            {/* Campo Clasificación con selector y botón (+) para agregar nuevo ítem */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-sm">category</span>
                  <span>Clasificación / Acción Terapéutica</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddClasif((v) => !v)}
                  className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">add</span>
                  <span>{showAddClasif ? 'Cancelar' : 'Agregar opción'}</span>
                </button>
              </div>

              {showAddClasif ? (
                <div className="flex gap-1.5 animate-fade-in">
                  <input
                    type="text"
                    placeholder="Ej. Antiflatulento, Antitusivo, etc."
                    value={newClasifInput}
                    onChange={(e) => setNewClasifInput(e.target.value)}
                    className={`${inputCls} flex-1`}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddNewClasif}
                    className="px-3 bg-primary text-on-primary text-xs font-bold uppercase cursor-pointer shrink-0"
                  >
                    Guardar
                  </button>
                </div>
              ) : (
                <select
                  value={clasificacion}
                  onChange={(e) => setClasificacion(e.target.value)}
                  className={`${inputCls} cursor-pointer font-medium`}
                >
                  <option value="">— Sin clasificación —</option>
                  {medicamentosClasificaciones.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Código SKU */}
            <div>
              <label className={labelCls}>Código SKU / Barras</label>
              <input
                type="text"
                placeholder="Ej. MED-001 o PAR-500"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className={`${inputCls} font-mono uppercase`}
              />
            </div>
          </div>

          {/* Fila 2: Nombre Genérico & Nombre Comercial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nombre Genérico */}
            <div>
              <label className={labelCls}>
                Nombre Genérico <span className="text-error">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Paracetamol, Amoxicilina, Ibuprofeno..."
                value={nombreGenerico}
                onChange={(e) => setNombreGenerico(e.target.value)}
                className={`${inputCls} font-semibold`}
                required
              />
            </div>

            {/* Nombre Comercial */}
            <div>
              <label className={labelCls}>Nombre Comercial / Marca (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. Panadol, Velamox, Doloral..."
                value={nombreComercial}
                onChange={(e) => setNombreComercial(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Fila 3: Concentración, Forma Farmacéutica y Vía */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Concentración */}
            <div>
              <label className={labelCls}>Concentración</label>
              <input
                type="text"
                placeholder="Ej. 500mg, 250mg/5ml..."
                value={concentracion}
                onChange={(e) => setConcentracion(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Forma Farmacéutica */}
            <div>
              <label className={labelCls}>Forma Farmacéutica</label>
              <select
                value={formaFarmaceutica}
                onChange={(e) => setFormaFarmaceutica(e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                {FORMAS_FARMACEUTICAS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Vía de Administración */}
            <div>
              <label className={labelCls}>Vía de Administración</label>
              <select
                value={viaAdministracion}
                onChange={(e) => setViaAdministracion(e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                {VIAS_ADMINISTRACION.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 4: CAMPO USO (Pediátrico, Adultos, etc.) */}
          <div className="p-3 bg-surface-container-low border border-surface-container-high">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-secondary text-sm">groups</span>
                <span>Población / Tipo de Uso</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddUso((v) => !v)}
                className="text-[10px] text-secondary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">add</span>
                <span>{showAddUso ? 'Cancelar' : 'Agregar uso'}</span>
              </button>
            </div>

            {showAddUso ? (
              <div className="flex gap-1.5 animate-fade-in">
                <input
                  type="text"
                  placeholder="Ej. Pediátrico, Adultos, etc."
                  value={newUsoInput}
                  onChange={(e) => setNewUsoInput(e.target.value)}
                  className={`${inputCls} flex-1`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddNewUso}
                  className="px-3 bg-secondary text-on-secondary text-xs font-bold uppercase cursor-pointer shrink-0"
                >
                  Guardar
                </button>
              </div>
            ) : (
              <select
                value={uso}
                onChange={(e) => setUso(e.target.value)}
                className={`${inputCls} cursor-pointer font-medium`}
              >
                {medicamentosUsos.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fila 5: Stock Actual, Stock Mínimo y Estado Activo */}
          <div className="p-3 bg-surface-container-low border border-surface-container-high grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            {/* Stock Actual */}
            <div>
              <label className={labelCls}>
                {isEditing ? 'Stock Actual' : 'Stock Inicial'}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={stockActual}
                onChange={(e) => setStockActual(Math.max(0, parseInt(e.target.value) || 0))}
                className={`${inputCls} font-mono font-bold text-sm text-right`}
              />
            </div>

            {/* Stock Mínimo */}
            <div>
              <label className={labelCls}>Stock Mínimo (Alerta)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(Math.max(0, parseInt(e.target.value) || 0))}
                className={`${inputCls} font-mono text-sm text-right`}
              />
            </div>

            {/* Estado Activo */}
            <div className="flex items-center h-9 pl-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                <span className="text-xs font-bold uppercase text-on-surface">
                  {activo ? 'Activo en Campaña' : 'Inactivo (Oculto)'}
                </span>
              </label>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container-high">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 border border-surface-container-highest text-xs font-semibold uppercase text-on-surface-variant hover:bg-surface-container cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm hover:bg-primary/90 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-base">
                {isEditing ? 'save' : 'add'}
              </span>
              <span>{isPending ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Medicamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
