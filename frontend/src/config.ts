declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_URL?: string
      VITE_API_URL?: string
    }
  }
}

/**
 * Obtiene la URL base de la API en tiempo de ejecución.
 * Prioridad:
 * 1. window.__APP_CONFIG__.API_URL (configurable sin recompilar desde /config.js)
 * 2. window.__APP_CONFIG__.VITE_API_URL
 * 3. import.meta.env.VITE_API_URL (variable de compilación)
 * 4. '/api' (fallback relativo)
 */
export function getApiUrl(): string {
  if (typeof window !== 'undefined' && window.__APP_CONFIG__) {
    const runtimeUrl = window.__APP_CONFIG__.API_URL || window.__APP_CONFIG__.VITE_API_URL
    if (runtimeUrl && typeof runtimeUrl === 'string' && runtimeUrl.trim() !== '') {
      return runtimeUrl.trim().replace(/\/+$/, '')
    }
  }

  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '')
  }

  return '/api'
}
