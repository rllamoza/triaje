import { useState, useEffect } from 'react'
import axios from 'axios'
import { getApiConfigInfo, setApiUrlOverride, type ApiConfigInfo } from '../../config'

interface ApiConnectionModalProps {
  isOpen: boolean
  onClose: () => void
}

interface TestResult {
  ok: boolean
  status?: number
  statusText?: string
  latencyMs: number
  testedUrl: string
  data?: any
  errorMessage?: string
  errorType?: 'cors' | 'network' | 'http' | 'mixed_content' | 'unknown'
}

export function ApiConnectionModal({ isOpen, onClose }: ApiConnectionModalProps) {
  const [configInfo, setConfigInfo] = useState<ApiConfigInfo>(getApiConfigInfo())
  const [customUrl, setCustomUrl] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [showOverrideInput, setShowOverrideInput] = useState(false)
  const [appliedNotification, setAppliedNotification] = useState('')

  useEffect(() => {
    if (isOpen) {
      const info = getApiConfigInfo()
      setConfigInfo(info)
      setCustomUrl(info.url)
      runTest(info.url)
    } else {
      setResult(null)
      setAppliedNotification('')
    }
  }, [isOpen])

  const runTest = async (urlToTest: string) => {
    setIsTesting(true)
    setResult(null)
    setAppliedNotification('')

    const cleanBase = urlToTest.trim().replace(/\/+$/, '')
    // Si no tiene prefijo http/https y no empieza con /, agregamos /
    const normalizedBase = !/^https?:\/\//i.test(cleanBase) && !cleanBase.startsWith('/')
      ? `/${cleanBase}`
      : cleanBase

    const fullTestUrl = `${normalizedBase}/auth/node-status`

    // Verificar Mixed Content
    const isHttpsOrigin = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const isHttpTarget = /^http:\/\//i.test(normalizedBase)

    if (isHttpsOrigin && isHttpTarget) {
      setIsTesting(false)
      setResult({
        ok: false,
        latencyMs: 0,
        testedUrl: fullTestUrl,
        errorType: 'mixed_content',
        errorMessage: 'Bloqueo Mixed Content: Tu frontend está en HTTPS (seguro), pero intentas conectar con HTTP (no seguro). El navegador bloquea esta llamada por seguridad. Usa https:// o un proxy SSL.',
      })
      return
    }

    const start = performance.now()

    try {
      // Intentar primero con /auth/node-status
      const res = await axios.get(fullTestUrl, {
        timeout: 9000,
        headers: { Accept: 'application/json' },
      })

      const latency = Math.round(performance.now() - start)

      setResult({
        ok: true,
        status: res.status,
        statusText: res.statusText || 'OK',
        latencyMs: latency,
        testedUrl: fullTestUrl,
        data: res.data,
      })
    } catch (err: any) {
      const latency = Math.round(performance.now() - start)
      let errorType: TestResult['errorType'] = 'unknown'
      let errorMessage = 'No se pudo comunicar con el servidor.'

      if (err.response) {
        // El servidor respondió con un status code fuera de 2xx
        errorType = 'http'
        const code = err.response.status
        if (code === 404) {
          errorMessage = `Error 404 Not Found: El servidor respondió pero la ruta '/auth/node-status' no existe. ¿Quizás falta el prefijo '/api' o configurar el rewrite de Apache / .htaccess?`
        } else if (code === 500) {
          errorMessage = `Error 500 Internal Server Error: El backend respondió pero ocurrió un fallo interno (posible error de conexión a MySQL en .env).`
        } else {
          errorMessage = `Error HTTP ${code}: ${err.response.statusText || 'Error en respuesta'}`
        }
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorType = 'network'
        errorMessage = 'Tiempo de espera agotado (Timeout > 9s). El servidor no responde o la IP/puerto es inalcanzable.'
      } else if (err.message === 'Network Error' || !err.response) {
        // En navegadores, Network Error suele ser CORS o Host inexistente
        errorType = 'cors'
        errorMessage = 'Network Error / Bloqueo CORS: El navegador no pudo completar la petición. Causas habituales: 1) El dominio/IP no está encendido o el puerto está cerrado. 2) Cabeceras CORS no permiten el subdominio de origen. 3) Certificado SSL autofirmado o inválido.'
      }

      setResult({
        ok: false,
        status: err.response?.status,
        latencyMs: latency,
        testedUrl: fullTestUrl,
        errorMessage,
        errorType,
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleApplyOverride = () => {
    if (!customUrl.trim()) return
    setApiUrlOverride(customUrl.trim())
    const newInfo = getApiConfigInfo()
    setConfigInfo(newInfo)
    setAppliedNotification('✓ URL guardada en memoria para esta sesión.')
    runTest(customUrl.trim())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-surface border border-surface-container-high shadow-2xl flex flex-col max-h-[90vh] overflow-hidden rounded-xs text-on-surface"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-2xl">
              network_check
            </span>
            <div>
              <h2 className="text-base font-semibold leading-tight text-on-surface">
                Validador de Conexión con la API
              </h2>
              <p className="text-xs text-on-surface-variant font-mono">
                Diagnóstico en tiempo real y resolución de rutas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xs transition-colors"
            title="Cerrar modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Card: Hacia dónde apunta actualmente */}
          <div className="p-3.5 bg-surface-container-low border border-surface-container-high rounded-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary font-mono">
                Destino Configurado
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-surface-container-high text-on-surface border border-outline/20 rounded-xs">
                {configInfo.source}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-secondary font-mono text-xs shrink-0">Base URL:</span>
                <span className="font-mono text-sm font-semibold text-primary break-all select-all">
                  {configInfo.url}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-secondary font-mono text-[11px] shrink-0">Resuelta en:</span>
                <span className="font-mono text-xs text-on-surface-variant break-all select-all">
                  {configInfo.resolvedFullUrl}
                </span>
              </div>
            </div>
          </div>

          {/* Estado de la prueba actual */}
          <div className="p-4 border rounded-xs transition-all">
            {isTesting ? (
              <div className="flex items-center gap-3 py-2 text-primary">
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="font-medium text-sm">
                  Probando conexión hacia el endpoint...
                </span>
              </div>
            ) : result?.ok ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-tertiary">
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                    <span className="font-bold text-sm">
                      ¡Conexión Exitosa con la API!
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container font-mono text-[11px] font-bold rounded-xs">
                    HTTP {result.status} • {result.latencyMs} ms
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant">
                  El frontend se comunica correctamente con el servidor backend y recibe respuestas JSON válidas.
                </p>

                {/* Datos devueltos */}
                {result.data && (
                  <div className="mt-2 p-2.5 bg-surface-container-lowest border border-surface-container-high font-mono text-[11px] space-y-1">
                    <div className="text-[10px] text-secondary uppercase font-bold tracking-wider">
                      Respuesta del Nodo:
                    </div>
                    {result.data.node_id && (
                      <div><strong className="text-on-surface">Nodo ID:</strong> {result.data.node_id}</div>
                    )}
                    {result.data.hardware && (
                      <div><strong className="text-on-surface">Hardware:</strong> {result.data.hardware}</div>
                    )}
                    {result.data.app && (
                      <div><strong className="text-on-surface">Aplicación:</strong> {result.data.app}</div>
                    )}
                    {result.data.timestamp && (
                      <div><strong className="text-on-surface">Timestamp:</strong> {result.data.timestamp}</div>
                    )}
                  </div>
                )}
              </div>
            ) : result && !result.ok ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-error">
                    <span className="material-symbols-outlined text-xl">error</span>
                    <span className="font-bold text-sm">
                      Fallo de Conexión con la API
                    </span>
                  </div>
                  {result.status && (
                    <span className="px-2 py-0.5 bg-error-container text-on-error-container font-mono text-[11px] font-bold rounded-xs">
                      HTTP {result.status}
                    </span>
                  )}
                </div>

                <div className="p-2.5 bg-error-container/20 border border-error/30 text-error text-xs rounded-xs font-mono leading-relaxed">
                  {result.errorMessage}
                </div>

                <div className="text-[11px] text-secondary space-y-1">
                  <div><strong>URL solicitada:</strong> <span className="font-mono text-on-surface">{result.testedUrl}</span></div>
                  <div><strong>Tiempo transcurrido:</strong> {result.latencyMs} ms</div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Herramienta para probar otra URL al vuelo */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => setShowOverrideInput(!showOverrideInput)}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-sm">
                {showOverrideInput ? 'expand_less' : 'tune'}
              </span>
              {showOverrideInput ? 'Ocultar probador manual de URL' : 'Probar otra URL de API manualmente'}
            </button>

            {showOverrideInput && (
              <div className="p-3 bg-surface-container-lowest border border-surface-container-high rounded-xs space-y-3 animate-in fade-in duration-100">
                <label className="block text-xs font-medium text-on-surface">
                  Escribe la URL base de la API a validar:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="ej: https://apitriaje.semillaperu.org/api o /api"
                    className="flex-1 px-3 py-1.5 bg-surface border border-surface-container-highest text-xs font-mono focus:outline-hidden focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => runTest(customUrl)}
                    disabled={isTesting || !customUrl.trim()}
                    className="px-3 py-1.5 bg-primary text-on-primary font-medium text-xs hover:opacity-90 disabled:opacity-50 shrink-0"
                  >
                    Probar URL
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-secondary">
                    💡 Tip: Si funciona, puedes aplicarla en esta sesión:
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyOverride}
                    className="px-2.5 py-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold rounded-xs transition-colors"
                  >
                    Usar en esta sesión
                  </button>
                </div>

                {appliedNotification && (
                  <p className="text-[11px] text-tertiary font-medium">
                    {appliedNotification}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Guía rápida de edición en producción */}
          <div className="p-3 bg-surface-container-high/40 border border-surface-container-high text-[11px] text-secondary space-y-1">
            <span className="font-semibold text-on-surface block">
              ¿Cómo cambiar la URL permanentemente en el servidor?
            </span>
            <p>
              Abre el archivo <strong className="text-on-surface font-mono">dist/config.js</strong> en tu hosting y actualiza el valor de <code className="font-mono text-primary">API_URL</code>. No necesitas recompilar la app.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-surface-container-low border-t border-surface-container-high flex items-center justify-between">
          <button
            type="button"
            onClick={() => runTest(configInfo.url)}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-surface-container-highest hover:bg-surface-container-high text-xs font-medium text-on-surface disabled:opacity-50 transition-colors"
          >
            <span className={`material-symbols-outlined text-sm ${isTesting ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Reintentar Prueba
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
