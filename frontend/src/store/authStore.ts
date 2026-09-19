import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthUser {
  id: number
  nombres: string
  apellidos: string
  full_name: string
  cmp_code: string | null
  dni: string | null
  role: 'admin' | 'medico' | 'triaje' | 'admision' | 'guardia'
  station_default: string | null
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  campaignId: number | null
  stationId: string | null
  expiresAt: string | null

  setAuth: (data: {
    token: string
    user: AuthUser
    campaign_id?: number
    station_id?: string
    expires_at?: string
  }) => void
  setCampaign: (id: number) => void
  setStation: (id: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      campaignId: null,
      stationId: null,
      expiresAt: null,

      setAuth: (data) =>
        set({
          token: data.token,
          user: data.user,
          campaignId: data.campaign_id ?? null,
          stationId: data.station_id ?? data.user.station_default,
          expiresAt: data.expires_at ?? null,
        }),

      setCampaign: (id) => set({ campaignId: id }),
      setStation: (id) => set({ stationId: id }),

      logout: () =>
        set({ token: null, user: null, campaignId: null, stationId: null, expiresAt: null }),

      isAuthenticated: () => {
        const { token, user, expiresAt } = get()
        if (!token || !user) return false
        if (expiresAt && new Date(expiresAt) < new Date()) return false
        return true
      },
    }),
    {
      name: 'triaje-auth',
    },
  ),
)
