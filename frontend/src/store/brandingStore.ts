import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BrandingState {
  // Encabezados y Nombres
  appName: string
  appTagline: string
  loginTitle: string
  loginSubtitle: string

  // Logotipos principales
  logoUrl: string
  isotipoUrl: string

  // Pie de Página
  footerLeftText: string
  footerCenterText: string
  footerRightText: string
  footerLogoUrl: string

  // Documentos a Exportar (Tickets, Fichas, Reportes)
  exportHeader: string
  exportSubheader: string
  exportFooterLegal: string
  ticketLogoUrl: string
  pdfLogoUrl: string
  selectedExportLogo: 'principal' | 'isotipo' | 'ticket_personalizado' | 'ninguno'

  // Acciones
  updateBranding: (data: Partial<Omit<BrandingState, 'updateBranding' | 'resetDefaults'>>) => void
  resetDefaults: () => void
}

export const DEFAULT_BRANDING = {
  appName: 'Semilla',
  appTagline: 'Triaje Clínico & Campañas',
  loginTitle: 'PLATAFORMA CLÍNICA DE TERRENO',
  loginSubtitle: 'Control y triaje offline-first para brigadas rurales',

  logoUrl:
    'https://lh3.googleusercontent.com/aida/AEtjO1WHui6EMlZ8nLYWhqM7Pt8xyBgk9V73SUi-O3GdU4QWAqyQOCDKLbzOxctZ7wZ3QiylxrmLuvQW71vVeBAssOJflzXXy76a1cXn6KwfL0JJAaxblaCy7MdqZr0BlEsQ4wKHJbGszn7p9AWkNF0LUcgBdjCcr0hKtytcRr-r3cFvcYm7_2Y7GIXLfg8IT-5Ta8t6TCqSLvT87qdOBISwCYI__NdVWoRNkfVnnJ30-vqAo6u2jU06N36Q89g_',
  isotipoUrl:
    'https://lh3.googleusercontent.com/aida/AEtjO1WZ0tE2OVs5Sheyc4hORQ0oGj271jvC10KhuNWKN1dg5zIqDxV7G-A7uAlo05HPtzIkVbqgyemo4dRRGPbfdkGxo6aQrrKFjPQ7xIccQx8klvnBNRNPpsibPhkHx5XYAJ2HK5ZrAmfuqejPoxEsriVD84qCOv1n4wuo4x9p_qVw4BA17-e0mGJupmkTuWM5DDoVqIrv2hP_BAqGfrBHTMMhrO_vKhumJiQEyQ-oiRRi1lEDdTH5vXQOKGkS',

  footerLeftText: 'Soporte Técnico Satelital: +51 84 290112',
  footerCenterText: 'Sincronización P2P: 6 dispositivos en red local',
  footerRightText: 'Build v2.4.9-field',
  footerLogoUrl: '',

  exportHeader: 'ONG SEMILLA • ASISTENCIA MÉDICA RURAL',
  exportSubheader: 'SISTEMA NACIONAL DE TRIAJE Y EVALUACIÓN CLÍNICA AMBULATORIA',
  exportFooterLegal:
    'Documento clínico emitido en campaña de campo. Válido para referencia hospitalaria y atención inmediata.',
  ticketLogoUrl: '',
  pdfLogoUrl: '',
  selectedExportLogo: 'principal' as const,
}

export const useBrandingStore = create<BrandingState>()(
  persist(
    (set) => ({
      ...DEFAULT_BRANDING,

      updateBranding: (data) =>
        set((state) => ({
          ...state,
          ...data,
        })),

      resetDefaults: () => set(() => ({ ...DEFAULT_BRANDING })),
    }),
    {
      name: 'triaje-branding-v1',
    },
  ),
)
