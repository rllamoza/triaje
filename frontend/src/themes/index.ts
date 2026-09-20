// Import all theme stylesheets
import './clinic/theme.css'
import './glass/theme.css'
import './cyberpunk/theme.css'

export * from './clinic'
export * from './glass'
export * from './cyberpunk'

import { clinicThemeMeta } from './clinic'
import { glassThemeMeta } from './glass'
import { cyberpunkThemeMeta } from './cyberpunk'

export const REGISTERED_THEMES = [
  clinicThemeMeta,
  glassThemeMeta,
  cyberpunkThemeMeta,
]

export type AvailableThemeId = 'clinic' | 'glass' | 'cyberpunk'
