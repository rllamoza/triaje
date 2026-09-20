import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'clinic' | 'glass' | 'cyberpunk'

export interface ThemeOption {
  id: ThemeMode
  name: string
  subtitle: string
  badge: string
  previewColors: string[]
  icon: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'clinic',
    name: 'Clinic',
    subtitle: 'IBM Carbon Clínico',
    badge: 'Original',
    previewColors: ['#0f62fe', '#f4f4f4', '#161616'],
    icon: 'local_hospital',
  },
  {
    id: 'glass',
    name: 'Clinica Glass',
    subtitle: 'Glassmorphism & Spring',
    badge: 'Stitch #17/18',
    previewColors: ['#0a2540', '#e8f1ff', '#cbdbf5'],
    icon: 'water_drop',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    subtitle: 'Dark Synth & Neón',
    badge: 'Stitch #19/20',
    previewColors: ['#d946ef', '#05050d', '#06b6d4'],
    icon: 'bolt',
  },
]

interface ThemeState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode | 'clinica-glass') => void
}

export const normalizeTheme = (theme: string): ThemeMode => {
  if (theme === 'clinica-glass' || theme === 'glass') return 'glass'
  if (theme === 'cyberpunk') return 'cyberpunk'
  return 'clinic'
}

export const applyThemeToDom = (rawTheme: string) => {
  if (typeof document === 'undefined') return
  const theme = normalizeTheme(rawTheme)
  const root = document.documentElement
  root.setAttribute('data-theme', theme === 'glass' ? 'clinica-glass' : theme)
  
  if (theme === 'cyberpunk') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'clinic',
      setTheme: (newTheme) => {
        const normalized = normalizeTheme(newTheme)
        applyThemeToDom(normalized)
        set({ theme: normalized })
      },
    }),
    {
      name: 'triaje-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          const normalized = normalizeTheme(state.theme)
          applyThemeToDom(normalized)
        }
      },
    },
  ),
)
