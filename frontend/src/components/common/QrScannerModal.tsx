import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { PATIENT_DATABASE, generatePatientQrPayload } from '../../services/patientRegistry'

interface QrScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (decodedText: string) => void
}

export function QrScannerModal({ isOpen, onClose, onScan }: QrScannerModalProps) {
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [fileScanning, setFileScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isOpen) {
      cleanupScanner()
      return
    }

    let isMounted = true

    const startCamera = async () => {
      try {
        setCameraError(null)
        setIsScanning(true)

        // Give DOM time to render container
        await new Promise((r) => setTimeout(r, 150))
        if (!isMounted) return

        const scanner = new Html5Qrcode('qr-reader-container')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleSuccess(decodedText)
          },
          () => {
            // scan failure callback (normal frame without QR)
          }
        )
      } catch (err: unknown) {
        console.warn('Error starting camera for QR scanner:', err)
        if (isMounted) {
          setCameraError(
            'No se pudo acceder a la cámara directa (permiso denegado o cámara no disponible). Puedes subir una imagen con QR o usar el acceso rápido.'
          )
          setIsScanning(false)
        }
      }
    }

    startCamera()

    return () => {
      isMounted = false
      cleanupScanner()
    }
  }, [isOpen])

  const cleanupScanner = () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear()
            scannerRef.current = null
          }).catch(() => {
            scannerRef.current = null
          })
        } else {
          scannerRef.current.clear()
          scannerRef.current = null
        }
      } catch {
        scannerRef.current = null
      }
    }
    setIsScanning(false)
  }

  const handleSuccess = (text: string) => {
    cleanupScanner()
    onScan(text)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileScanning(true)
    setCameraError(null)

    try {
      let scanner = scannerRef.current
      if (!scanner) {
        scanner = new Html5Qrcode('qr-reader-container')
        scannerRef.current = scanner
      }

      const result = await scanner.scanFile(file, true)
      setFileScanning(false)
      handleSuccess(result)
    } catch (err) {
      console.warn('Failed to scan file:', err)
      setFileScanning(false)
      setCameraError('No se encontró ningún código QR legible en la imagen seleccionada.')
    }
  }

  const handleDemoSelect = (patientIndex: number) => {
    const p = PATIENT_DATABASE[patientIndex]
    if (p) {
      const payload = generatePatientQrPayload(p)
      handleSuccess(payload)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-surface max-w-lg w-full shadow-2xl border border-surface-container-high font-sans text-on-surface flex flex-col overflow-hidden max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-surface-container border-b border-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[24px]">qr_code_scanner</span>
            <div>
              <h3 className="text-base font-bold text-on-surface tracking-tight">
                Escáner Óptico de Código QR
              </h3>
              <p className="text-xs text-on-surface-variant font-mono">
                Lectura de tickets térmicos y credenciales clínicas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Viewfinder Container */}
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="relative w-full aspect-square max-w-[320px] mx-auto bg-black rounded-xs overflow-hidden flex items-center justify-center border-2 border-primary/50 shadow-inner">
            <div id="qr-reader-container" className="w-full h-full" />

            {/* Viewfinder reticle overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-primary border-dashed relative animate-pulse">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />
              </div>
            </div>

            {isScanning && (
              <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono py-1 px-2 text-center rounded">
                Apunta la cámara al código QR del ticket
              </div>
            )}
          </div>

          {/* Camera Error or Warning */}
          {cameraError && (
            <div className="p-3 bg-error-container/20 border border-error/30 text-error text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">info</span>
              <div className="leading-snug">{cameraError}</div>
            </div>
          )}

          {/* File Upload Alternative */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={fileScanning}
              className="w-full py-2 px-3 bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-xs font-bold uppercase tracking-wider text-on-surface flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">add_photo_alternate</span>
              <span>{fileScanning ? 'Analizando imagen...' : 'Subir imagen con QR'}</span>
            </button>
          </div>

          {/* Quick Demo Test Buttons */}
          <div className="p-3 bg-surface-container-low border border-surface-container-high space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-tertiary">bolt</span>
              Prueba Rápida / Simulación de Escaneo
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoSelect(0)}
                className="p-2 text-left bg-surface hover:bg-primary-container/20 border border-surface-container-high hover:border-primary transition-all cursor-pointer group"
              >
                <div className="font-bold text-on-surface group-hover:text-primary flex items-center justify-between">
                  <span>T-104 • Juan Quispe</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#f1c21b] text-[#161616] font-mono font-bold">P2</span>
                </div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">DNI: 42918274 • Med. General</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect(1)}
                className="p-2 text-left bg-surface hover:bg-error-container/20 border border-surface-container-high hover:border-error transition-all cursor-pointer group"
              >
                <div className="font-bold text-on-surface group-hover:text-error flex items-center justify-between">
                  <span>T-101 • Rosa Mamani</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-error text-on-error font-mono font-bold">P1 Crítico</span>
                </div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">DNI: 02817462 • Crisis Hipertensiva</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect(2)}
                className="p-2 text-left bg-surface hover:bg-primary-container/20 border border-surface-container-high hover:border-primary transition-all cursor-pointer group"
              >
                <div className="font-bold text-on-surface group-hover:text-primary flex items-center justify-between">
                  <span>T-102 • Dylan Huallpa</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-error text-on-error font-mono font-bold">P1 Pediatría</span>
                </div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">DNI: 78291043 • Convulsión febril</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect(3)}
                className="p-2 text-left bg-surface hover:bg-primary-container/20 border border-surface-container-high hover:border-primary transition-all cursor-pointer group"
              >
                <div className="font-bold text-on-surface group-hover:text-primary flex items-center justify-between">
                  <span>T-105 • Hilda Ramos</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#f1c21b] text-[#161616] font-mono font-bold">P2 Gestante</span>
                </div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">DNI: 48920194 • Gineco-Obstetricia</div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-surface-container border-t border-surface-container-high flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface text-on-surface hover:bg-surface-container-high text-xs font-bold uppercase tracking-wider border border-surface-container-high cursor-pointer transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
