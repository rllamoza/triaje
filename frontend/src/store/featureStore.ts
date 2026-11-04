import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TriajeSubOptions {
  somatometria: boolean // Peso, Talla, IMC
  signosVitales: boolean // Presión arterial, FC, Temperatura
  oximetriaRespiracion: boolean // SpO2, Frecuencia respiratoria
  examenesAuxiliares: boolean // Glucosa capilar, Escala Glasgow
  imprimirTicketTriaje: boolean // Impresión de ticket en box de triaje
}

export interface RegistroFieldsConfig {
  // Sección 1: Datos Personales complementarios
  estadoCivil: boolean
  lenguaMaterna: boolean

  // Sección 2: Datos de Residencia y Contacto
  seccionResidencia: boolean
  comunidad: boolean
  telefono: boolean
  altitud: boolean
  tiempoViaje: boolean
  seguro: boolean

  // Sección 3: Antecedentes & Factores de Riesgo Crónico
  seccionAntecedentes: boolean // Switch general para mostrar u ocultar toda la Sección 3
  hipertension: boolean
  diabetes: boolean
  asma: boolean
  anemia: boolean
  gestante: boolean
  alergias: boolean
}

export interface FeatureState {
  // Módulo de triaje (desactivado por defecto según requerimiento)
  triajeEnabled: boolean
  triajeOptions: TriajeSubOptions

  // Configuración de campos del formulario de registro de beneficiarios
  registroFields: RegistroFieldsConfig

  // Modulos adicionales configurables
  consultaEnabled: boolean
  farmaciaEnabled: boolean

  // Acciones
  setTriajeEnabled: (enabled: boolean) => void
  setTriajeOption: <K extends keyof TriajeSubOptions>(option: K, value: boolean) => void
  setRegistroField: <K extends keyof RegistroFieldsConfig>(field: K, value: boolean) => void
  setSeccionAntecedentes: (enabled: boolean) => void
  setSeccionResidencia: (enabled: boolean) => void
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

const defaultRegistroFields: RegistroFieldsConfig = {
  estadoCivil: true,
  lenguaMaterna: true,
  seccionResidencia: true,
  comunidad: true,
  telefono: true,
  altitud: true,
  tiempoViaje: true,
  seguro: true,
  seccionAntecedentes: false, // Desactivado por defecto según requerimiento de campaña
  hipertension: true,
  diabetes: true,
  asma: true,
  anemia: true,
  gestante: true,
  alergias: true,
}

export const useFeatureStore = create<FeatureState>()(
  persist(
    (set) => ({
      triajeEnabled: false, // Desactivado por defecto
      triajeOptions: { ...defaultTriajeOptions },
      registroFields: { ...defaultRegistroFields },
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
      setRegistroField: (field, value) =>
        set((state) => ({
          registroFields: {
            ...state.registroFields,
            [field]: value,
          },
        })),
      setSeccionAntecedentes: (enabled: boolean) =>
        set((state) => ({
          registroFields: {
            ...state.registroFields,
            seccionAntecedentes: enabled,
          },
        })),
      setSeccionResidencia: (enabled: boolean) =>
        set((state) => ({
          registroFields: {
            ...state.registroFields,
            seccionResidencia: enabled,
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
          registroFields: { ...defaultRegistroFields },
          consultaEnabled: true,
          farmaciaEnabled: true,
        }),
    }),
    {
      name: 'semilla_feature_flags_v2',
    }
  )
)
