import { useState, useEffect } from 'react'
import type { MedicamentoAdmin } from '../../api/hooks'
import { useAdjustStockMedicamento } from '../../api/hooks'

interface MedicamentoStockModalProps {
  isOpen: boolean
  onClose: () => void
  medicamento: MedicamentoAdmin | null
  campaignId: number
  onSuccess?: (msg: string) => void
}

type TipoOperacion = 'ingreso' | 'egreso' | 'ajuste'

export function MedicamentoStockModal({
  isOpen,
  onClose,
  medicamento,
  campaignId,
  onSuccess,
}: MedicamentoStockModalProps) {
  const adjustMutation = useAdjustStockMedicamento()
  const [tipo, setTipo] = useState<TipoOperacion>('ingreso')
  const [cantidad, setCantidad] = useState<number>(10)
  const [motivo, setMotivo] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && medicamento) {
      setTipo('ingreso')
      setCantidad(10)
      setMotivo('')
      setErrorMsg(null)
    }
  }, [isOpen, medicamento])

  if (!isOpen || !medicamento) return null

  const stockActual = medicamento.stock_actual ?? 0

  // Cálculo del nuevo stock previsto
  let stockPrevisto = stockActual
  if (tipo === 'ingreso') {
    stockPrevisto = stockActual + (cantidad || 0)
  } else if (tipo === 'egreso') {
    stockPrevisto = Math.max(0, stockActual - (cantidad || 0))
  } else if (tipo === 'ajuste') {
    stockPrevisto = Math.max(0, cantidad || 0)
  }

  const isBajo = stockPrevisto <= (medicamento.stock_minimo ?? 10)
  const isAgotado = stockPrevisto === 0

  const handleQuickAdd = (delta: number) => {
    setCantidad((prev) => Math.max(1, (prev || 0) + delta))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (cantidad < 0) {
      setErrorMsg('La cantidad no puede ser negativa.')
      return
    }

    if (tipo === 'egreso' && cantidad > stockActual) {
      setErrorMsg(`No puede retirar ${cantidad} unidades. El stock actual es de solo ${stockActual}.`)
      return
    }

    try {
      await adjustMutation.mutateAsync({
        id: medicamento.id,
        campaign_id: campaignId,
        tipo,
        cantidad,
        motivo: motivo.trim() || undefined,
      })

      const accionTexto =
        tipo === 'ingreso'
          ? `+${cantidad} unidades ingresadas`
          : tipo === 'egreso'
          ? `-${cantidad} unidades retiradas`
          : `ajustado a ${cantidad} unidades`

      onSuccess?.(
        `Stock de "${medicamento.nombre_generico}" actualizado (${accionTexto}). Nuevo stock: ${stockPrevisto}.`
      )
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Error al ajustar el inventario.'
      setErrorMsg(msg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border-2 border-primary shadow-2xl w-full max-w-lg p-6 text-on-surface animate-fade-in my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary/10 text-primary flex items-center justify-center rounded">
              <span className="material-symbols-outlined text-xl">inventory_2</span>
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide text-on-surface">
                Manejar Stock de Medicamento
              </h2>
              <div className="text-[11px] text-on-surface-variant font-mono">
                {medicamento.codigo ? `[${medicamento.codigo}] ` : ''}
                {medicamento.nombre_generico} {medicamento.concentracion || ''}
              </div>
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
          {/* Tarjeta de Stock Actual */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-surface-container-low border border-surface-container-high">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Stock Actual en Almacén
              </div>
              <div className="text-2xl font-mono font-black text-on-surface mt-0.5">
                {stockActual} <span className="text-xs font-normal text-on-surface-variant">unid.</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Stock Mínimo de Alerta
              </div>
              <div className="text-2xl font-mono font-bold text-on-surface-variant mt-0.5">
                {medicamento.stock_minimo}{' '}
                <span className="text-xs font-normal text-on-surface-variant">unid.</span>
              </div>
            </div>
          </div>

          {/* Selector de Tipo de Movimiento */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Tipo de Movimiento / Operación
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTipo('ingreso')}
                className={`py-2.5 px-3 border text-xs font-bold uppercase flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  tipo === 'ingreso'
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                <span>Ingreso (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('egreso')}
                className={`py-2.5 px-3 border text-xs font-bold uppercase flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  tipo === 'egreso'
                    ? 'bg-error text-on-error border-error shadow-xs'
                    : 'bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-lg">remove_circle</span>
                <span>Salida (-)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipo('ajuste')
                  setCantidad(stockActual)
                }}
                className={`py-2.5 px-3 border text-xs font-bold uppercase flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  tipo === 'ajuste'
                    ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                    : 'bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-lg">tune</span>
                <span>Fijar / Conteo (=)</span>
              </button>
            </div>
          </div>

          {/* Input de Cantidad y botones rápidos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                {tipo === 'ingreso'
                  ? 'Cantidad a Ingresar'
                  : tipo === 'egreso'
                  ? 'Cantidad a Retirar'
                  : 'Nuevo Stock Físico Total'}
              </label>
              <div className="text-[11px] text-on-surface-variant font-mono">
                {tipo === 'egreso' && `Máximo disponible: ${stockActual}`}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCantidad((prev) => Math.max(0, (prev || 0) - 1))}
                className="w-10 h-10 bg-surface-container border border-surface-container-highest text-on-surface font-bold text-lg flex items-center justify-center hover:bg-surface-container-highest cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                step="1"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 h-10 px-3 bg-surface-container-low text-base font-mono font-black text-center border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setCantidad((prev) => (prev || 0) + 1)}
                className="w-10 h-10 bg-surface-container border border-surface-container-highest text-on-surface font-bold text-lg flex items-center justify-center hover:bg-surface-container-highest cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Atajos de cantidad rápida */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-on-surface-variant uppercase font-semibold mr-1">Rápido:</span>
              {[+5, +10, +25, +50, +100].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleQuickAdd(delta)}
                  className="px-2 py-1 text-[11px] font-mono font-semibold bg-surface-container hover:bg-surface-container-highest text-on-surface border border-surface-container-high cursor-pointer"
                >
                  +{delta}
                </button>
              ))}
              {tipo === 'egreso' && (
                <button
                  type="button"
                  onClick={() => setCantidad(stockActual)}
                  className="ml-auto px-2 py-1 text-[10px] font-bold uppercase bg-error/10 hover:bg-error/20 text-error border border-error/30 cursor-pointer"
                >
                  Retirar Todo ({stockActual})
                </button>
              )}
            </div>
          </div>

          {/* Motivo del Ajuste */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Motivo u Observación (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Donación de botiquín, Conteo físico, Merma por caducidad..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full h-9 px-3 bg-surface-container-low text-xs border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          {/* Previsualización del Resultado */}
          <div
            className={`p-3.5 border flex items-center justify-between transition-colors ${
              isAgotado
                ? 'bg-error-container/20 border-error'
                : isBajo
                ? 'bg-warning-container/20 border-warning'
                : 'bg-primary-container/20 border-primary/30'
            }`}
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Stock Final Resultante
              </div>
              <div className="text-xl font-mono font-black text-on-surface mt-0.5">
                {stockPrevisto} <span className="text-xs font-normal text-on-surface-variant">unidades</span>
              </div>
            </div>
            <div className="text-right">
              {isAgotado ? (
                <span className="px-2 py-1 text-[10px] font-bold uppercase bg-error text-on-error">
                  Agotado (0 unidades)
                </span>
              ) : isBajo ? (
                <span className="px-2 py-1 text-[10px] font-bold uppercase bg-warning text-on-warning">
                  Alerta Stock Bajo (≤ {medicamento.stock_minimo})
                </span>
              ) : (
                <span className="px-2 py-1 text-[10px] font-bold uppercase bg-primary text-on-primary">
                  Stock Óptimo
                </span>
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container-high">
            <button
              type="button"
              onClick={onClose}
              disabled={adjustMutation.isPending}
              className="px-4 py-2.5 border border-surface-container-highest text-xs font-semibold uppercase text-on-surface-variant hover:bg-surface-container cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={adjustMutation.isPending}
              className="px-6 py-2.5 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm hover:bg-primary/90 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">check</span>
              <span>{adjustMutation.isPending ? 'Aplicando Ajuste...' : 'Confirmar Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

