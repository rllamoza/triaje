import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { getApiUrl } from '../config'

export const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
})


// ── Request interceptor: attach dynamic baseURL & Bearer token ──
api.interceptors.request.use((config) => {
  config.baseURL = getApiUrl()

  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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
