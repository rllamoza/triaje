import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
})

function getClientAuditTelemetry(): string | null {
  try {
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null
    const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection
    return JSON.stringify({
      screen: typeof window !== 'undefined' ? `${window.screen?.width || 0}x${window.screen?.height || 0}` : null,
      timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null,
      language: nav?.language ?? null,
      effectiveType: conn?.effectiveType ?? null,
      rtt: conn?.rtt ?? null,
      downlink: conn?.downlink ?? null,
      saveData: conn?.saveData ?? false,
      hardwareConcurrency: nav?.hardwareConcurrency ?? null,
    })
  } catch {
    return null
  }
}

// ── Request interceptor: attach Bearer token & client telemetry ──
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const telemetry = getClientAuditTelemetry()
  if (telemetry) {
    config.headers['X-Client-Audit-Telemetry'] = telemetry
  }

  return config
})

// ── Response interceptor: handle 401 ─────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? ''
      // Don't auto-logout if it's the login action itself that returned 401
      if (!url.includes('/auth/login') && !url.includes('/auth/login-pin')) {
        useAuthStore.getState().logout()
        try {
          localStorage.removeItem('triaje-auth')
        } catch {}
      }
    }
    return Promise.reject(error)
  },
)

export default api
