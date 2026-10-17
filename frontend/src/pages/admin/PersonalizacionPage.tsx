import { useState, useRef } from 'react'
import { useBrandingStore, DEFAULT_BRANDING } from '../../store/brandingStore'

export default function PersonalizacionPage() {
  const branding = useBrandingStore()
  const { updateBranding, resetDefaults } = branding

  // Form local state
  const [formData, setFormData] = useState({
    appName: branding.appName,
    appTagline: branding.appTagline,
    loginTitle: branding.loginTitle,
    loginSubtitle: branding.loginSubtitle,
    logoUrl: branding.logoUrl,
    isotipoUrl: branding.isotipoUrl,
    footerLeftText: branding.footerLeftText,
    footerCenterText: branding.footerCenterText,
    footerRightText: branding.footerRightText,
    footerLogoUrl: branding.footerLogoUrl,
    exportHeader: branding.exportHeader,
    exportSubheader: branding.exportSubheader,
    exportFooterLegal: branding.exportFooterLegal,
    ticketLogoUrl: branding.ticketLogoUrl,
    pdfLogoUrl: branding.pdfLogoUrl,
    selectedExportLogo: branding.selectedExportLogo,
  })

  const [activeTab, setActiveTab] = useState<'cabecera' | 'pie' | 'exportacion'>('cabecera')
  const [savedSuccess, setSavedSuccess] = useState(false)

  // File input refs
  const logoFileRef = useRef<HTMLInputElement>(null)
  const isotipoFileRef = useRef<HTMLInputElement>(null)
  const footerLogoFileRef = useRef<HTMLInputElement>(null)
  const ticketLogoFileRef = useRef<HTMLInputElement>(null)
  const pdfLogoFileRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (field: keyof typeof formData, file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setFormData((prev) => ({ ...prev, [field]: result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateBranding(formData)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3500)
  }

  const handleReset = () => {
    if (window.confirm('¿Está seguro de restablecer todos los títulos y logotipos a los valores originales de ONG Semilla?')) {
      resetDefaults()
      setFormData({ ...DEFAULT_BRANDING })
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3500)
    }
  }

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="fixed top-16 right-6 z-50 bg-[#0f62fe] text-white px-5 py-3 shadow-xl border border-blue-400 flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider">Configuración Aplicada</div>
            <div className="text-xs text-white/90">Los títulos, subtítulos y logotipos se actualizaron exitosamente en todo el sistema.</div>
          </div>
          <button onClick={() => setSavedSuccess(false)} className="ml-4 text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header Contextual Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-primary-container text-on-primary-fixed">
              ADM-09
            </span>
            <span className="px-2 py-0.5 text-[11px] font-medium bg-surface-container text-on-surface-variant flex items-center gap-1.5 border border-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              Ajustes Institucionales de Identidad &amp; Branding
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-on-surface">
            Personalización de Títulos, Subtítulos <span className="font-semibold text-primary">&amp; Logotipos</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Configure la identidad visual, nombres de campaña, logotipos de cabecera y pie de página, y sellos para documentos clínicos exportables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="h-10 px-4 border border-surface-container-highest text-xs font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors flex items-center gap-2 cursor-pointer rounded-none"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            <span>Restablecer por Defecto</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-10 px-5 bg-primary text-on-primary text-xs font-semibold hover:bg-on-primary-fixed-variant transition-colors shadow-xs flex items-center gap-2 cursor-pointer rounded-none uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-container-high gap-2 mb-6">
        <button
          onClick={() => setActiveTab('cabecera')}
          className={`px-5 py-3 text-[14px] font-bold flex items-center gap-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'cabecera'
              ? 'border-primary text-primary bg-surface'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">web</span>
          <span>1. Cabeceras, Títulos y Logos</span>
        </button>

        <button
          onClick={() => setActiveTab('pie')}
          className={`px-5 py-3 text-[14px] font-bold flex items-center gap-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'pie'
              ? 'border-primary text-primary bg-surface'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">vertical_align_bottom</span>
          <span>2. Pie de Página &amp; Terminal</span>
        </button>

        <button
          onClick={() => setActiveTab('exportacion')}
          className={`px-5 py-3 text-[14px] font-bold flex items-center gap-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'exportacion'
              ? 'border-primary text-primary bg-surface'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
          <span>3. Documentos a Exportar (Tickets &amp; PDF)</span>
        </button>
      </div>

      {/* Content Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: CABECERA & LOGOS */}
        {activeTab === 'cabecera' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Fields */}
            <div className="bg-surface border border-surface-container-high p-6 space-y-5">
              <h2 className="text-[15px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-2.5 border-b border-surface-container-high pb-3">
                <span className="material-symbols-outlined text-[20px] text-primary">edit_note</span>
                <span>Textos de Barra Superior y Acceso</span>
              </h2>

              <div className="space-y-4 text-[13.5px]">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Título Principal de la Aplicación (Navbar)
                  </label>
                  <input
                    type="text"
                    value={formData.appName}
                    onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-container-highest bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    placeholder="Ej. Semilla"
                  />
                  <span className="text-[11px] text-on-surface-variant">Se muestra junto al logotipo en la barra fija superior.</span>
                </div>

                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Subtítulo / Lema de la Barra Superior
                  </label>
                  <input
                    type="text"
                    value={formData.appTagline}
                    onChange={(e) => setFormData({ ...formData, appTagline: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-container-highest bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    placeholder="Ej. Triaje Clínico & Campañas"
                  />
                  <span className="text-[11px] text-on-surface-variant">Acompaña al título en mayúsculas pequeñas.</span>
                </div>

                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Título en Pantalla de Login / Acceso
                  </label>
                  <input
                    type="text"
                    value={formData.loginTitle}
                    onChange={(e) => setFormData({ ...formData, loginTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-container-highest bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    placeholder="Ej. PLATAFORMA CLÍNICA DE TERRENO"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Subtítulo en Pantalla de Login
                  </label>
                  <input
                    type="text"
                    value={formData.loginSubtitle}
                    onChange={(e) => setFormData({ ...formData, loginSubtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-container-highest bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    placeholder="Ej. Control y triaje offline-first para brigadas rurales"
                  />
                </div>
              </div>

              {/* File / URL Logo Principal */}
              <div className="pt-4 border-t border-surface-container-high space-y-3">
                <label className="block font-semibold text-xs text-on-surface">
                  Logotipo Principal (Navbar y Pantallas Principales)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="URL de la imagen o archivo subido"
                    className="flex-1 px-3 py-1.5 text-xs border border-surface-container-highest bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                  />
                  <input
                    type="file"
                    ref={logoFileRef}
                    accept="image/*"
                    onChange={(e) => handleFileUpload('logoUrl', e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoFileRef.current?.click()}
                    className="px-3 py-1.5 bg-surface-container text-xs font-medium border border-surface-container-highest hover:bg-surface-container-high flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">upload</span>
                    <span>Subir</span>
                  </button>
                </div>
              </div>

              {/* File / URL Isotipo */}
              <div className="pt-3 space-y-3">
                <label className="block font-semibold text-xs text-on-surface">
                  Isotipo / Emblema Cuadrado (Icono institucional, Login y Fichas)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.isotipoUrl}
                    onChange={(e) => setFormData({ ...formData, isotipoUrl: e.target.value })}
                    placeholder="URL del isotipo o archivo subido"
                    className="flex-1 px-3 py-1.5 text-xs border border-surface-container-highest bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                  />
                  <input
                    type="file"
                    ref={isotipoFileRef}
                    accept="image/*"
                    onChange={(e) => handleFileUpload('isotipoUrl', e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => isotipoFileRef.current?.click()}
                    className="px-3 py-1.5 bg-surface-container text-xs font-medium border border-surface-container-highest hover:bg-surface-container-high flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">upload</span>
                    <span>Subir</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Preview Panel */}
            <div className="bg-surface border border-surface-container-high p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 border-b border-surface-container-high pb-2 mb-4">
                  <span className="material-symbols-outlined text-base text-primary">visibility</span>
                  <span>Previsualización en Tiempo Real</span>
                </h2>

                <div className="space-y-6">
                  {/* Navbar preview */}
                  <div>
                    <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Vista previa de Cabecera (Navbar)
                    </div>
                    <div className="bg-surface h-14 border border-surface-container-high px-4 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        {formData.logoUrl ? (
                          <img src={formData.logoUrl} alt="Logo" className="h-8 w-auto max-w-[140px] object-contain" />
                        ) : (
                          <div className="h-8 w-20 bg-surface-container flex items-center justify-center text-[10px] text-on-surface-variant border border-dashed border-outline">
                            Sin Logo
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold tracking-tight text-on-surface">
                            {formData.appName || 'Semilla'}
                          </span>
                          <span className="text-xs text-on-surface-variant">|</span>
                          <span className="text-xs font-normal text-on-surface-variant uppercase tracking-wider">
                            {formData.appTagline || 'Triaje Clínico'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-primary font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>En línea</span>
                      </div>
                    </div>
                  </div>

                  {/* Isotipo preview */}
                  <div>
                    <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Vista previa de Isotipo y Login
                    </div>
                    <div className="p-4 bg-surface-container-low border border-surface-container-high flex items-center gap-4">
                      {formData.isotipoUrl ? (
                        <img src={formData.isotipoUrl} alt="Isotipo" className="w-14 h-14 object-contain rounded border border-surface-container-high bg-white p-1" />
                      ) : (
                        <div className="w-14 h-14 bg-surface-container flex items-center justify-center text-[10px] text-on-surface-variant border border-dashed border-outline">
                          Sin Isotipo
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-on-surface tracking-wider uppercase">
                          {formData.loginTitle || 'PLATAFORMA CLÍNICA DE TERRENO'}
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          {formData.loginSubtitle || 'Control y triaje offline-first'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-surface-container-high text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm align-middle mr-1 text-primary">info</span>
                Las imágenes subidas se procesan directamente de forma segura en formato Base64 para garantizar soporte total 100% offline sin conexión a internet.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PIE DE PÁGINA */}
        {activeTab === 'pie' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-surface-container-high p-6 space-y-5">
              <h2 className="text-[15px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-2.5 border-b border-surface-container-high pb-3">
                <span className="material-symbols-outlined text-[20px] text-primary">vertical_align_bottom</span>
                <span>Configuración de Textos y Logos Inferiores</span>
              </h2>

              <div className="space-y-4 text-[13.5px]">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Texto Izquierdo (Soporte / Contacto Satelital)
                  </label>
                  <input
                    type="text"
                    value={formData.footerLeftText}
                    onChange={(e) => setFormData({ ...formData, footerLeftText: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-container-highest bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    placeholder="Ej. Soporte Técnico Satelital: +51 84 290112"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Texto Central (Estado P2P / Nodo / Sincronización)
                  </label>
                  <input
                    type="text"
                    value={formData.footerCenterText}
                    onChange={(e) => setFormData({ ...formData, footerCenterText: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-container-highest bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    placeholder="Ej. Sincronización P2P: 6 dispositivos en red local"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Texto Derecho (Identificador de Build / Versión)
                  </label>
                  <input
                    type="text"
                    value={formData.footerRightText}
                    onChange={(e) => setFormData({ ...formData, footerRightText: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-container-highest bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    placeholder="Ej. Build v2.4.9-field"
                  />
                </div>

                {/* Sello o Logo inferior */}
                <div className="pt-3 border-t border-surface-container-high space-y-2">
                  <label className="block font-semibold text-on-surface">
                    Logo o Sello Institucional Inferior (Opcional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.footerLogoUrl}
                      onChange={(e) => setFormData({ ...formData, footerLogoUrl: e.target.value })}
                      placeholder="URL del sello o archivo"
                      className="flex-1 px-3 py-1.5 text-xs border border-surface-container-highest bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    />
                    <input
                      type="file"
                      ref={footerLogoFileRef}
                      accept="image/*"
                      onChange={(e) => handleFileUpload('footerLogoUrl', e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => footerLogoFileRef.current?.click()}
                      className="px-3 py-1.5 bg-surface-container text-xs font-medium border border-surface-container-highest hover:bg-surface-container-high flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">upload</span>
                      <span>Subir</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview Footer */}
            <div className="bg-surface border border-surface-container-high p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 border-b border-surface-container-high pb-2 mb-4">
                  <span className="material-symbols-outlined text-base text-primary">visibility</span>
                  <span>Previsualización del Pie de Página</span>
                </h2>

                <div className="border border-surface-container-high bg-[#161616] text-[#c6c6c6] p-4 text-xs font-mono">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#393939] pb-3 mb-3">
                    <div className="flex items-center gap-2 text-xs">
                      {formData.footerLogoUrl && (
                        <img src={formData.footerLogoUrl} alt="Sello" className="h-6 w-auto object-contain" />
                      )}
                      <span>{formData.footerLeftText || 'Soporte Técnico Satelital'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{formData.footerCenterText || 'Red Mesh Estable'}</span>
                    </div>

                    <div className="text-xs text-[#8d8d8d]">
                      {formData.footerRightText || 'Build v2.4.9-field'}
                    </div>
                  </div>

                  <div className="text-[11px] text-[#8d8d8d] text-center">
                    Área reservada para firmas digitales y telemetría de dispositivos en campaña
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-surface-container-high text-xs text-on-surface-variant">
                El pie de página se replica automáticamente en la pantalla de inicio de sesión y en los paneles de telemetría de campo.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DOCUMENTOS A EXPORTAR */}
        {activeTab === 'exportacion' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-surface-container-high p-6 space-y-5">
              <h2 className="text-[15px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-2.5 border-b border-surface-container-high pb-3">
                <span className="material-symbols-outlined text-[20px] text-primary">receipt_long</span>
                <span>Logos y Encabezados para Tickets Térmicos y PDFs</span>
              </h2>

              <div className="space-y-4 text-[13.5px]">
                {/* CONFIGURACIÓN DEL LOGO PARA TICKET TÉRMICO */}
                <div className="p-4 bg-surface-container-low border-2 border-primary/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">print</span>
                      <span>Logo que irá en el Ticket Térmico</span>
                    </label>
                    {formData.ticketLogoUrl ? (
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Logo Propio del Ticket
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        Fallback: Usa Logo Principal
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-on-surface-variant">
                    Indique la imagen o logotipo exclusivo para la cabecera del ticket térmico (58mm/80mm). 
                    <strong className="text-on-surface"> Si este campo queda vacío o no se escogió ningún logo, el sistema usará automáticamente el Logotipo Principal</strong>.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.ticketLogoUrl}
                      onChange={(e) => setFormData({ ...formData, ticketLogoUrl: e.target.value })}
                      placeholder="URL del logo para ticket (Dejar vacío para usar Logo Principal)"
                      className="flex-1 px-3 py-2 text-xs border border-surface-container-highest bg-surface text-on-surface focus:outline-none focus:border-primary font-mono"
                    />
                    <input
                      type="file"
                      ref={ticketLogoFileRef}
                      accept="image/*"
                      onChange={(e) => handleFileUpload('ticketLogoUrl', e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => ticketLogoFileRef.current?.click()}
                      className="px-3 py-2 bg-surface text-xs font-semibold border border-surface-container-highest hover:bg-surface-container-high flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">upload</span>
                      <span>Subir</span>
                    </button>
                    {formData.ticketLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ticketLogoUrl: '' })}
                        title="Restablecer para usar el logotipo principal"
                        className="px-2.5 py-2 bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/30 hover:bg-rose-500/20 flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">backspace</span>
                        <span>Usar Principal</span>
                      </button>
                    )}
                  </div>

                  {/* Visual preview of effective logo */}
                  <div className="p-2.5 bg-surface border border-surface-container flex items-center gap-3">
                    <div className="w-12 h-12 bg-white flex items-center justify-center border border-surface-container-high p-1">
                      {formData.ticketLogoUrl ? (
                        <img src={formData.ticketLogoUrl} alt="Logo Ticket" className="max-h-full max-w-full object-contain filter grayscale contrast-200" />
                      ) : formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo Principal Fallback" className="max-h-full max-w-full object-contain filter grayscale contrast-200" />
                      ) : (
                        <span className="text-[9px] font-mono text-black font-bold">SIN LOGO</span>
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-on-surface">
                        {formData.ticketLogoUrl ? 'Logotipo Personalizado para Tickets Activo' : 'Logotipo Principal Activo (Por Defecto)'}
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        {formData.ticketLogoUrl
                          ? 'Optimizado específicamente para bobinas térmicas ESC/POS.'
                          : 'Se utilizará automáticamente el logotipo institucional cargado en Cabeceras.'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-surface-container-low border border-surface-container-high space-y-2">
                  <label className="block font-semibold text-on-surface">
                    Logo para Fichas Clínicas y Reportes de Cierre (PDF A4)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.pdfLogoUrl}
                      onChange={(e) => setFormData({ ...formData, pdfLogoUrl: e.target.value })}
                      placeholder="URL del logo para documentos PDF (Dejar vacío para usar Principal)"
                      className="flex-1 px-3 py-1.5 text-xs border border-surface-container-highest bg-surface text-on-surface focus:outline-none focus:border-primary font-mono"
                    />
                    <input
                      type="file"
                      ref={pdfLogoFileRef}
                      accept="image/*"
                      onChange={(e) => handleFileUpload('pdfLogoUrl', e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => pdfLogoFileRef.current?.click()}
                      className="px-3 py-1.5 bg-surface text-xs font-medium border border-surface-container-highest hover:bg-surface-container-high flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">upload</span>
                      <span>Subir</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">Sello de alta resolución para impresión en hojas A4 de historia clínica y hojas de referencia.</span>
                </div>

                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Encabezado Institucional del Documento
                  </label>
                  <input
                    type="text"
                    value={formData.exportHeader}
                    onChange={(e) => setFormData({ ...formData, exportHeader: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-container-highest bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    placeholder="Ej. ONG SEMILLA • ASISTENCIA MÉDICA RURAL"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Sub-encabezado / Dependencia Clínica
                  </label>
                  <input
                    type="text"
                    value={formData.exportSubheader}
                    onChange={(e) => setFormData({ ...formData, exportSubheader: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-container-highest bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    placeholder="Ej. SISTEMA NACIONAL DE TRIAJE Y EVALUACIÓN CLÍNICA"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Pie Legal / Cláusula de Validez del Documento
                  </label>
                  <textarea
                    rows={2}
                    value={formData.exportFooterLegal}
                    onChange={(e) => setFormData({ ...formData, exportFooterLegal: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-container-highest bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    placeholder="Cláusula de referencia hospitalaria..."
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Thermal Ticket */}
            <div className="bg-surface border border-surface-container-high p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center justify-between border-b border-surface-container-high pb-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">receipt</span>
                    <span>Simulación del Ticket Térmico</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-surface-container text-on-surface-variant border border-surface-container-highest">
                    58mm / 80mm
                  </span>
                </h2>

                {/* Thermal Ticket Preview (Clean, ordered, high-clarity typography) */}
                <div className="max-w-[310px] mx-auto bg-white text-black p-5 font-sans text-xs border-2 border-black shadow-xl antialiased">
                  {/* Effective Logo */}
                  <div className="text-center mb-2.5">
                    <div className="flex justify-center mb-1.5">
                      {formData.ticketLogoUrl ? (
                        <img
                          src={formData.ticketLogoUrl}
                          alt="Logo Ticket Personalizado"
                          className="h-12 w-auto object-contain filter grayscale contrast-200"
                        />
                      ) : formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Logo Principal (Fallback)"
                          className="h-12 w-auto object-contain filter grayscale contrast-200"
                        />
                      ) : (
                        <div className="text-xs uppercase font-black text-black border border-black px-2 py-1">[ LOGO INSTITUCIONAL ]</div>
                      )}
                    </div>
                    <div className="font-black text-[13px] uppercase text-black tracking-wide leading-tight">
                      {formData.exportHeader || 'ONG SEMILLA'}
                    </div>
                    <div className="text-[11px] font-bold text-black uppercase tracking-tight mt-0.5">
                      {formData.exportSubheader || 'TRIAJE CLÍNICO & ATENCIÓN INTEGRAL'}
                    </div>
                    <div className="border-b-2 border-dashed border-black my-2.5" />
                  </div>

                  {/* Ticket Code and Specialty */}
                  <div className="text-center my-2 bg-black/5 p-2 border border-black/20">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-black">ESPECIALIDAD MÉDICA</div>
                    <div className="text-sm font-black text-black uppercase">MEDICINA GENERAL</div>
                    <div className="text-[10px] font-bold text-black uppercase">DR. MARCO HUAMAN QUISPE (CMP-89241)</div>

                    <div className="my-1 border-t border-dashed border-black/30 pt-1">
                      <div className="text-[10px] font-extrabold uppercase text-black">CÓDIGO DE TURNO</div>
                      <div className="text-3xl font-black tracking-wider text-black font-mono">
                        MED-0001
                      </div>
                    </div>

                    <div className="mt-1 text-[11px] font-black bg-black text-white px-2 py-0.5 inline-block uppercase">
                      PRIORIDAD I — EMERGENCIA
                    </div>
                  </div>

                  <div className="border-b-2 border-dashed border-black my-2.5" />

                  {/* Patient Info */}
                  <div className="space-y-1.5 text-xs text-black">
                    <div className="flex justify-between">
                      <span className="font-bold text-black">PACIENTE:</span>
                      <span className="font-black text-right text-black uppercase">MAMANI QUISPE, ROSA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-black">DNI:</span>
                      <span className="font-black text-black">02817462</span>
                      <span className="font-bold text-black">EDAD:</span>
                      <span className="font-black text-black">67 AÑOS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-black">DESTINO:</span>
                      <span className="font-black text-black">CONSULTORIO 01</span>
                      <span className="font-bold text-black">HORA:</span>
                      <span className="font-black text-black">09:15</span>
                    </div>
                  </div>

                  <div className="border-b-2 border-dashed border-black my-2.5" />

                  {/* Footer */}
                  <div className="text-[10px] text-center text-black font-bold uppercase leading-tight">
                    {formData.exportFooterLegal || 'Conserve este ticket para ser llamado por altavoz a triaje y luego a consulta médica.'}
                  </div>
                  <div className="text-[9px] text-center text-black/70 font-mono mt-1">
                    CUPOS ASIGNADOS CONFORME A CAPACIDAD OPERATIVA
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-surface-container-high text-xs text-on-surface-variant text-center">
                El logotipo visualizado arriba se aplicará automáticamente en los tickets impresos desde Admisión y Triaje.
              </div>
            </div>
          </div>
        )}


        {/* Bottom Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-container-high">
          <div className="text-xs text-on-surface-variant">
            Los cambios se guardan localmente en el navegador y se aplican en tiempo real en todos los módulos del sistema.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-surface-container-highest text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer"
            >
              Restablecer
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              <span>Guardar Configuración</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
