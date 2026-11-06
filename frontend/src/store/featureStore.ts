export interface MedicamentoColumnConfig {
  key: string
  label: string
  visible: boolean
  order: number
}

export const DEFAULT_MEDICAMENTOS_COLUMNS: MedicamentoColumnConfig[] = [
  { key: 'clasificacion', label: 'Clasificación', visible: true, order: 1 },
  { key: 'codigo', label: 'Código', visible: true, order: 2 },
  { key: 'medicamento', label: 'Medicamento', visible: true, order: 3 },
  { key: 'concentracion', label: 'Concentración', visible: true, order: 4 },
  { key: 'forma_farmaceutica', label: 'Forma', visible: true, order: 5 },
  { key: 'via_administracion', label: 'Vía', visible: true, order: 6 },
  { key: 'stock_actual', label: 'Stock', visible: true, order: 7 },
  { key: 'stock_minimo', label: 'Mín.', visible: true, order: 8 },
  { key: 'activo', label: 'Estado', visible: true, order: 9 },
  { key: 'uso', label: 'Uso', visible: true, order: 10 },
]

export const DEFAULT_CLASIFICACIONES: string[] = [
  'Antiflatulento',
  'Antitusivo',
  'Antibiótico',
  'Analgésico',
  'Antiinflamatorio',
  'Antipirético',
  'Antihistamínico',
  'Antiespasmódico',
  'Antiparasitario',
  'Antidiarreico',
  'Antiácido',
  'Broncodilatador',
  'Corticoide',
  'Vitamínico / Suplemento',
  'Otro',
]

export const DEFAULT_USOS: string[] = [
  'Pediátrico',
  'Adultos',
  'Geriátrico / Adulto Mayor',
  'Neonatal',
  'Obstétrico / Gestante',
  'Uso General',
]

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

export interface FarmaciaConfig {
  imprimirCargo: boolean
  tipoCargo: 'firma' | 'foto' | 'ambos' | 'ninguno'
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
  farmaciaConfig: FarmaciaConfig
  medicamentosColumns: MedicamentoColumnConfig[]
  medicamentosClasificaciones: string[]
  medicamentosUsos: string[]

  // Acciones medicamentos
  setMedicamentosColumns: (cols: MedicamentoColumnConfig[]) => void
  toggleMedicamentoColumn: (key: string, visible: boolean) => void
  moveMedicamentoColumn: (key: string, direction: 'up' | 'down') => void
  addMedicamentoClasificacion: (clasif: string) => void
  removeMedicamentoClasificacion: (clasif: string) => void
  addMedicamentoUso: (uso: string) => void
  removeMedicamentoUso: (uso: string) => void

  // Acciones
  setTriajeEnabled: (enabled: boolean) => void
  setTriajeOption: <K extends keyof TriajeSubOptions>(option: K, value: boolean) => void
  setRegistroField: <K extends keyof RegistroFieldsConfig>(field: K, value: boolean) => void
  setSeccionAntecedentes: (enabled: boolean) => void
  setSeccionResidencia: (enabled: boolean) => void
  setModuleEnabled: (module: 'consulta' | 'farmacia', enabled: boolean) => void
  setFarmaciaConfig: (config: Partial<FarmaciaConfig>) => void
  resetDefaults: () => void
}

const defaultTriajeOptions: TriajeSubOptions = {
  somatometria: true,
  signosVitales: true,
  oximetriaRespiracion: true,
  examenesAuxiliares: true,
  imprimirTicketTriaje: true,
}

const defaultFarmaciaConfig: FarmaciaConfig = {
  imprimirCargo: true,
  tipoCargo: 'firma',
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
      farmaciaConfig: { ...defaultFarmaciaConfig },
      medicamentosColumns: [...DEFAULT_MEDICAMENTOS_COLUMNS],
      medicamentosClasificaciones: [...DEFAULT_CLASIFICACIONES],
      medicamentosUsos: [...DEFAULT_USOS],

      setMedicamentosColumns: (cols) => set({ medicamentosColumns: cols }),

      toggleMedicamentoColumn: (key, visible) =>
        set((state) => ({
          medicamentosColumns: state.medicamentosColumns.map((c) =>
            c.key === key ? { ...c, visible } : c
          ),
        })),

      moveMedicamentoColumn: (key, direction) =>
        set((state) => {
          const sorted = [...state.medicamentosColumns].sort((a, b) => a.order - b.order)
          const idx = sorted.findIndex((c) => c.key === key)
          if (idx === -1) return state
          const targetIdx = direction === 'up' ? idx - 1 : idx + 1
          if (targetIdx < 0 || targetIdx >= sorted.length) return state

          // Intercambiar orden
          const temp = sorted[idx]
          sorted[idx] = sorted[targetIdx]
          sorted[targetIdx] = temp

          const reordered = sorted.map((col, i) => ({ ...col, order: i + 1 }))
          return { medicamentosColumns: reordered }
        }),

      addMedicamentoClasificacion: (clasif) =>
        set((state) => {
          const clean = clasif.trim()
          if (!clean || state.medicamentosClasificaciones.includes(clean)) return state
          return {
            medicamentosClasificaciones: [...state.medicamentosClasificaciones, clean],
          }
        }),

      removeMedicamentoClasificacion: (clasif) =>
        set((state) => ({
          medicamentosClasificaciones: state.medicamentosClasificaciones.filter((c) => c !== clasif),
        })),

      addMedicamentoUso: (uso) =>
        set((state) => {
          const clean = uso.trim()
          if (!clean || state.medicamentosUsos.includes(clean)) return state
          return {
            medicamentosUsos: [...state.medicamentosUsos, clean],
          }
        }),

      removeMedicamentoUso: (uso) =>
        set((state) => ({
          medicamentosUsos: state.medicamentosUsos.filter((u) => u !== uso),
        })),

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
      setFarmaciaConfig: (config) =>
        set((state) => ({
          farmaciaConfig: {
            ...state.farmaciaConfig,
            ...config,
          },
        })),
      resetDefaults: () =>
        set({
          triajeEnabled: false,
          triajeOptions: { ...defaultTriajeOptions },
          registroFields: { ...defaultRegistroFields },
          consultaEnabled: true,
          farmaciaEnabled: true,
          farmaciaConfig: { ...defaultFarmaciaConfig },
          medicamentosColumns: [...DEFAULT_MEDICAMENTOS_COLUMNS],
          medicamentosClasificaciones: [...DEFAULT_CLASIFICACIONES],
          medicamentosUsos: [...DEFAULT_USOS],
        }),
    }),
    {
      name: 'semilla_feature_flags_v2',
    }
  )
)
