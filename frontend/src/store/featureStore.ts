import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TriajeSubOptions {
  somatometria: boolean // Peso, Talla, IMC
  signosVitales: boolean // Presión arterial, FC, Temperatura
  oximetriaRespiracion: boolean // SpO2, Frecuencia respiratoria
  examenesAuxiliares: boolean // Glucosa capilar, Escala Glasgow
  imprimirTicketTriaje: boolean // Impresión de ticket en box de triaje
}

export interface FeatureState {
  // Módulo de triaje (desactivado por defecto según requerimiento)
  triajeEnabled: boolean
  triajeOptions: TriajeSubOptions

  // Modulos adicionales configurables
  consultaEnabled: boolean
  farmaciaEnabled: boolean

  // Acciones
  setTriajeEnabled: (enabled: boolean) => void
  setTriajeOption: <K extends keyof TriajeSubOptions>(option: K, value: boolean) => void
  setModuleEnabled: (module: 'consulta' | 'farmacia', enabled: boolean) => void
  resetDefaults: () => void
}

const defaultTriajeOptions: TriajeSubOptions = {
  somatometria: true,
  signosVitales: true,
  oximetriaRespiracion: true,
  examenesAuxiliares: true,
  imprimirTicketTriaje: true,
}

export const useFeatureStore = create<FeatureState>()(
  persist(
    (set) => ({
      triajeEnabled: false, // Desactivado por defecto
      triajeOptions: { ...defaultTriajeOptions },
      consultaEnabled: true,
      farmaciaEnabled: true,

      setTriajeEnabled: (enabled: boolean) => set({ triajeEnabled: enabled }),
      setTriajeOption: (option, value) =>
        set((state) => ({
          triajeOptions: {
            ...state.triajeOptions,
            [option]: value,
          },
        })),
      setModuleEnabled: (module, enabled) =>
        set((state) => ({
          ...state,
          [`${module}Enabled`]: enabled,
        })),
      resetDefaults: () =>
        set({
          triajeEnabled: false,
          triajeOptions: { ...defaultTriajeOptions },
          consultaEnabled: true,
          farmaciaEnabled: true,
        }),
    }),
    {
      name: 'semilla_feature_flags_v1',
    }
  )
)
