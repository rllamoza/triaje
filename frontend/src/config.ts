declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_URL?: string
      VITE_API_URL?: string
    }
  }
}

export interface ApiConfigInfo {
  url: string
  source: 'window.__APP_CONFIG__.API_URL (dist/config.js)' | 'window.__APP_CONFIG__.VITE_API_URL' | 'import.meta.env.VITE_API_URL (compilado)' | 'default (/api)'
  isAbsolute: boolean
  resolvedFullUrl: string
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

/**
 * Provee diagnóstico detallado sobre el origen y resolución de la URL de la API.
 */
export function getApiConfigInfo(): ApiConfigInfo {
  let url = '/api'
  let source: ApiConfigInfo['source'] = 'default (/api)'

  if (typeof window !== 'undefined' && window.__APP_CONFIG__?.API_URL) {
    url = window.__APP_CONFIG__.API_URL.trim().replace(/\/+$/, '')
    source = 'window.__APP_CONFIG__.API_URL (dist/config.js)'
  } else if (typeof window !== 'undefined' && window.__APP_CONFIG__?.VITE_API_URL) {
    url = window.__APP_CONFIG__.VITE_API_URL.trim().replace(/\/+$/, '')
    source = 'window.__APP_CONFIG__.VITE_API_URL'
  } else {
    const envUrl = import.meta.env.VITE_API_URL
    if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
      url = envUrl.trim().replace(/\/+$/, '')
      source = 'import.meta.env.VITE_API_URL (compilado)'
    }
  }

  const isAbsolute = /^https?:\/\//i.test(url)
  const resolvedFullUrl = isAbsolute
    ? url
    : (typeof window !== 'undefined' ? `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}` : url)

  return {
    url,
    source,
    isAbsolute,
    resolvedFullUrl
  }
}

/**
 * Permite cambiar la URL en memoria durante la sesión para pruebas inmediatas.
 */
export function setApiUrlOverride(newUrl: string): void {
  if (typeof window !== 'undefined') {
    if (!window.__APP_CONFIG__) {
      window.__APP_CONFIG__ = {}
    }
    window.__APP_CONFIG__.API_URL = newUrl.trim()
  }
}
