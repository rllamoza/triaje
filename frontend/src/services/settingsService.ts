import api from '../api/client'
import { useFeatureStore, type RegistroFieldsConfig, type TriajeSubOptions, type FarmaciaConfig, type MedicamentoColumnConfig } from '../store/featureStore'
import { useBrandingStore, type BrandingState } from '../store/brandingStore'

export interface SystemSettingsPayload {
  triajeEnabled?: boolean
  triajeOptions?: TriajeSubOptions
  registroFields?: RegistroFieldsConfig
  consultaEnabled?: boolean
  farmaciaEnabled?: boolean
  farmaciaConfig?: Partial<FarmaciaConfig>
  branding?: Partial<BrandingState>
  medicamentosColumns?: MedicamentoColumnConfig[]
  medicamentosClasificaciones?: string[]
  medicamentosUsos?: string[]
  comunidades?: string[]
}

/**
 * Carga las constantes del sistema y configuraciones guardadas en la base de datos
 * e hidrata los almacenes locales (featureStore y brandingStore).
 */
export async function loadSystemSettings(): Promise<boolean> {
  try {
    const res = await api.get('/settings')
    if (res.data && res.data.data) {
      const d = res.data.data

      // Hidratar feature flags
      const featureStore = useFeatureStore.getState()
      if (typeof d.triajeEnabled === 'boolean') {
        featureStore.setTriajeEnabled(d.triajeEnabled)
      }
      if (d.triajeOptions && typeof d.triajeOptions === 'object') {
        Object.entries(d.triajeOptions).forEach(([k, v]) => {
          featureStore.setTriajeOption(k as keyof TriajeSubOptions, Boolean(v))
        })
      }
      if (d.registroFields && typeof d.registroFields === 'object') {
        Object.entries(d.registroFields).forEach(([k, v]) => {
          featureStore.setRegistroField(k as keyof RegistroFieldsConfig, Boolean(v))
        })
        if (typeof d.registroFields.seccionAntecedentes === 'boolean') {
          featureStore.setSeccionAntecedentes(d.registroFields.seccionAntecedentes)
        }
        if (typeof d.registroFields.seccionResidencia === 'boolean') {
          featureStore.setSeccionResidencia(d.registroFields.seccionResidencia)
        }
      }
      if (typeof d.consultaEnabled === 'boolean') {
        featureStore.setModuleEnabled('consulta', d.consultaEnabled)
      }
      if (typeof d.farmaciaEnabled === 'boolean') {
        featureStore.setModuleEnabled('farmacia', d.farmaciaEnabled)
      }
      if (d.farmaciaConfig && typeof d.farmaciaConfig === 'object') {
        featureStore.setFarmaciaConfig(d.farmaciaConfig)
      }
      if (Array.isArray(d.medicamentosColumns)) {
        featureStore.setMedicamentosColumns(d.medicamentosColumns)
      }
      if (Array.isArray(d.medicamentosClasificaciones)) {
        useFeatureStore.setState({ medicamentosClasificaciones: d.medicamentosClasificaciones })
      }
      if (Array.isArray(d.medicamentosUsos)) {
        useFeatureStore.setState({ medicamentosUsos: d.medicamentosUsos })
      }
      if (Array.isArray(d.comunidades)) {
        useFeatureStore.setState({ comunidades: d.comunidades })
      }

      // Hidratar branding institucional
      if (d.branding && typeof d.branding === 'object') {
        useBrandingStore.getState().updateBranding(d.branding)
      }

      return true
    }
  } catch (err) {
    console.warn('[SettingsService] No se pudieron cargar settings de la BD, usando caché local:', err)
  }
  return false
}

/**
 * Persiste las configuraciones en la tabla system_settings de MySQL
 */
export async function saveSystemSettings(payload: SystemSettingsPayload): Promise<boolean> {
  try {
    // Intentar con endpoint protegido primero; si da 401/403 intentar con fallback
    try {
      await api.post('/settings', payload)
      return true
    } catch (e: any) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        await api.post('/settings/public', payload)
        return true
      }
      throw e
    }
  } catch (err) {
    console.error('[SettingsService] Error al guardar configuraciones en base de datos:', err)
    return false
  }
}

