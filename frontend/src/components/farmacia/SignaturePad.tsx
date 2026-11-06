import { useRef, useEffect, useState } from 'react'

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void
  disabled?: boolean
}

export function SignaturePad({ onSignatureChange, disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Configurar canvas para alta densidad de píxeles
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    canvas.setPointerCapture(e.pointerId)
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
    if (!hasSignature) setHasSignature(true)
  }

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.releasePointerCapture(e.pointerId)

    // Exportar base64
    const dataUrl = canvas.toDataURL('image/png')
    onSignatureChange(dataUrl)
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onSignatureChange(null)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-primary">draw</span>
          <span>Firma Digital del Paciente / Cargo *</span>
        </label>
        {hasSignature && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-mono text-error hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">delete</span>
            <span>Limpiar Firma</span>
          </button>
        )}
      </div>

      <div className="relative border-2 border-dashed border-surface-container-highest bg-white rounded-xs overflow-hidden select-none touch-none">
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          className="w-full h-32 cursor-crosshair block"
        />

        {!hasSignature && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
            <span className="material-symbols-outlined text-2xl mb-1">history_edu</span>
            <span className="text-xs font-medium">Firme aquí con el dedo, stylus o mouse</span>
          </div>
        )}

        <div className="absolute bottom-1 left-2 pointer-events-none text-[10px] font-mono text-slate-400">
          Línea de firma de conformidad
        </div>
      </div>
    </div>
  )
}

