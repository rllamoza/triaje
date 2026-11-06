import { useState, useEffect } from 'react'
import type { MedicamentoAdmin } from '../../api/hooks'

interface DescontarMedicamentoModalProps {
  medicamento: MedicamentoAdmin | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (item: {
    medicamento_id: number
    nombre: string
    concentracion?: string
    forma?: string
    via?: string
    cantidad: number
    dosis?: string
    indicaciones?: string
  }) => void
  initialCantidad?: number
  initialDosis?: string
  initialIndicaciones?: string
}

export function DescontarMedicamentoModal({
  medicamento,
  isOpen,
  onClose,
  onConfirm,
  initialCantidad = 1,
  initialDosis = '',
  initialIndicaciones = '',
}: DescontarMedicamentoModalProps) {
  const [cantidad, setCantidad] = useState<number>(initialCantidad)
  const [dosis, setDosis] = useState<string>(initialDosis)
  const [indicaciones, setIndicaciones] = useState<string>(initialIndicaciones)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (medicamento) {
      setCantidad(initialCantidad || 1)
      setDosis(initialDosis || '')
      setIndicaciones(initialIndicaciones || '')
      setError('')
    }
  }, [medicamento, initialCantidad, initialDosis, initialIndicaciones])

  if (!isOpen || !medicamento) return null

  const stockActual = medicamento.stock_actual ?? 0
  const stockRestante = stockActual - cantidad

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    if (cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0.')
      return
    }
    if (cantidad > stockActual) {
      setError(`La cantidad excede el stock disponible (${stockActual} unidades).`)
      return
    }

    onConfirm({
      medicamento_id: medicamento.id,
      nombre: medicamento.nombre_generico,
      concentracion: medicamento.concentracion || undefined,
      forma: medicamento.forma_farmaceutica || undefined,
      via: medicamento.via_administracion || undefined,
      cantidad,
      dosis,
      indicaciones,
    })
    onClose()
  }

  const setQuickAmount = (val: number) => {
    const limited = Math.min(val, stockActual)
    setCantidad(Math.max(1, limited))
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-surface border border-surface-container-highest shadow-2xl p-6 text-on-surface animate-scale-in">
        {/* Cabecera */}
        <div className="flex items-start justify-between pb-3 border-b border-surface-container-high">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono uppercase bg-primary text-on-primary">
                {medicamento.codigo || 'FARMACIA'}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-surface-container-high text-on-surface-variant uppercase">
                {medicamento.forma_farmaceutica} • Vía {medicamento.via_administracion}
              </span>
            </div>
            <h3 className="text-xl font-bold text-on-surface tracking-tight">
              {medicamento.nombre_generico}
            </h3>
            {medicamento.nombre_comercial && (
              <p className="text-xs text-primary font-medium">
                Comercial: {medicamento.nombre_comercial}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Indicador de Stock */}
        <div className="my-4 p-3 bg-surface-container-low border border-surface-container-high flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Stock Físico en Campaña
            </div>
            <div className="text-2xl font-mono font-bold text-on-surface mt-0.5">
              {stockActual} <span className="text-xs font-normal text-on-surface-variant">{medicamento.forma_farmaceutica}(s)</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Stock Proyectado
            </div>
            <div
              className={`text-lg font-mono font-bold mt-0.5 ${
                stockRestante < 0
                  ? 'text-error'
                  : stockRestante <= (medicamento.stock_minimo || 10)
                  ? 'text-amber-500'
                  : 'text-emerald-500'
              }`}
            >
              {stockRestante} rest.
            </div>
          </div>
        </div>

        <form onSubmit={handleApply} className="space-y-4">
          {/* Selector de Cantidad */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1.5">
              Cantidad a entregar / descontar para esta receta *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCantidad((prev) => Math.max(1, prev - 1))}
                className="w-10 h-10 border border-surface-container-highest bg-surface-container hover:bg-surface-container-high text-lg font-bold flex items-center justify-center cursor-pointer select-none"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={stockActual}
                value={cantidad}
                onChange={(e) => {
                  setCantidad(parseInt(e.target.value) || 0)
                  setError('')
                }}
                className="flex-1 h-10 px-3 text-center font-mono text-lg font-bold bg-surface border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setCantidad((prev) => Math.min(stockActual, prev + 1))}
                className="w-10 h-10 border border-surface-container-highest bg-surface-container hover:bg-surface-container-high text-lg font-bold flex items-center justify-center cursor-pointer select-none"
              >
                +
              </button>
            </div>

            {/* Botones de selección rápida */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-on-surface-variant font-medium mr-1 uppercase">Rápido:</span>
              {[1, 2, 5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={num > stockActual}
                  onClick={() => setQuickAmount(num)}
                  className={`px-2 py-0.5 text-xs font-mono font-medium border cursor-pointer ${
                    cantidad === num
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-surface-container-highest'
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  +{num}
                </button>
              ))}
              <button
                type="button"
                disabled={stockActual <= 0}
                onClick={() => setQuickAmount(stockActual)}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-surface-container-high hover:bg-surface-container-highest text-primary border border-primary/30 cursor-pointer ml-auto disabled:opacity-30"
              >
                Todo ({stockActual})
              </button>
            </div>
          </div>

          {/* Dosis / Frecuencia */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              Dosis y Frecuencia (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. 1 tableta cada 8 horas por 3 días"
              value={dosis}
              onChange={(e) => setDosis(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-surface border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          {/* Indicaciones para el paciente */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              Indicaciones de Toma / Cuidados Especiales (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Tomar después de las comidas con abundante agua"
              value={indicaciones}
              onChange={(e) => setIndicaciones(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-surface border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>{error}</span>
            </div>
          )}

          {/* Acciones */}
          <div className="pt-3 border-t border-surface-container-high flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-surface-container-highest text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={stockActual <= 0 || cantidad <= 0 || cantidad > stockActual}
              className="px-5 py-2 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              <span className="material-symbols-outlined text-base">add_task</span>
              <span>Asignar a esta Receta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

