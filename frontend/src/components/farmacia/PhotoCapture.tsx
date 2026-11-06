import { useState, useRef } from 'react'

interface PhotoCaptureProps {
  onPhotoChange: (dataUrl: string | null) => void
  disabled?: boolean
}

export function PhotoCapture({ onPhotoChange, disabled = false }: PhotoCaptureProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setPhotoPreview(dataUrl)
      onPhotoChange(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      setIsCameraActive(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      }, 100)
    } catch (err) {
      console.warn('Cámara web no disponible o denegada, usando selector de archivo:', err)
      fileInputRef.current?.click()
    }
  }

  const takeSnapshot = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      setPhotoPreview(dataUrl)
      onPhotoChange(dataUrl)
    }
    stopCamera()
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  const handleClear = () => {
    stopCamera()
    setPhotoPreview(null)
    onPhotoChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-primary">photo_camera</span>
          <span>Foto de Evidencia / Cargo de Entrega *</span>
        </label>
        {photoPreview && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-mono text-error hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">delete</span>
            <span>Eliminar Foto</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
        disabled={disabled}
      />

      {isCameraActive ? (
        <div className="relative border border-primary bg-black rounded-xs overflow-hidden">
          <video ref={videoRef} className="w-full h-48 object-cover" playsInline muted />
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-3">
            <button
              type="button"
              onClick={takeSnapshot}
              className="px-4 py-1.5 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 cursor-pointer rounded-xs"
            >
              <span className="material-symbols-outlined text-sm">camera</span>
              <span>Capturar Foto</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-1.5 bg-surface text-on-surface text-xs font-medium cursor-pointer rounded-xs"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : photoPreview ? (
        <div className="relative border border-surface-container-high bg-surface-container-low p-2 rounded-xs flex items-center gap-3">
          <img
            src={photoPreview}
            alt="Evidencia de entrega"
            className="w-20 h-20 object-cover border border-surface-container-highest rounded-xs"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
              <span>Foto de entrega registrada</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Evidencia gráfica lista para archivar en el cargo de entrega.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
              >
                Cambiar foto
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-surface-container-highest p-4 rounded-xs text-center bg-surface-container-low flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={startCamera}
            disabled={disabled}
            className="px-3 py-2 bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 hover:bg-on-primary-fixed-variant transition-colors cursor-pointer rounded-xs"
          >
            <span className="material-symbols-outlined text-sm">photo_camera</span>
            <span>Tomar Foto con Cámara</span>
          </button>
          <span className="text-xs text-on-surface-variant font-mono">o</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="px-3 py-2 border border-surface-container-highest bg-surface hover:bg-surface-container text-xs font-medium text-on-surface flex items-center gap-1.5 transition-colors cursor-pointer rounded-xs"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            <span>Subir Archivo de Imagen</span>
          </button>
        </div>
      )}
    </div>
  )
}

