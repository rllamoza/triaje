import { useState, useRef } from 'react'
import { useBrandingStore, DEFAULT_BRANDING } from '../../store/brandingStore'
import { useFeatureStore } from '../../store/featureStore'
import { saveSystemSettings } from '../../services/settingsService'

export default function PersonalizacionPage() {
  const branding = useBrandingStore()
  const { updateBranding, resetDefaults } = branding
  const featureStore = useFeatureStore()
  const {
    triajeEnabled,
    triajeOptions,
    setTriajeEnabled,
    registroFields,
    setSeccionAntecedentes,
    setSeccionResidencia,
    consultaEnabled,
    farmaciaEnabled,
    farmaciaConfig,
    setFarmaciaConfig,
    medicamentosColumns,
    medicamentosClasificaciones,
    medicamentosUsos,
        toggleMedicamentoColumn,
    moveMedicamentoColumn,
    addMedicamentoClasificacion,
    removeMedicamentoClasificacion,
    addMedicamentoUso,
    removeMedicamentoUso,
    setModuleEnabled,
  } = featureStore

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
    ticketShowQr: branding.ticketShowQr ?? false,
    ticketPatientFontSize: branding.ticketPatientFontSize ?? 'grande',
    ticketPaperWidth: branding.ticketPaperWidth ?? '80mm',
  })

  const [activeTab, setActiveTab] = useState<'cabecera' | 'pie' | 'exportacion' | 'modulos'>('cabecera')
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    updateBranding(formData)
    await saveSystemSettings({
      branding: formData,
      registroFields: useFeatureStore.getState().registroFields,
      triajeEnabled: useFeatureStore.getState().triajeEnabled,
      triajeOptions: useFeatureStore.getState().triajeOptions,
      consultaEnabled: useFeatureStore.getState().consultaEnabled,
      farmaciaEnabled: useFeatureStore.getState().farmaciaEnabled,
      farmaciaConfig: useFeatureStore.getState().farmaciaConfig,
    })
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3500)
  }

  const handleToggleAntecedentes = async (val: boolean) => {
    setSeccionAntecedentes(val)
    const updated = { ...useFeatureStore.getState().registroFields, seccionAntecedentes: val }
    await saveSystemSettings({ registroFields: updated })
  }

  const handleToggleResidencia = async (val: boolean) => {
    setSeccionResidencia(val)
    const updated = { ...useFeatureStore.getState().registroFields, seccionResidencia: val }
    await saveSystemSettings({ registroFields: updated })
  }

  const handleToggleField = async (field: any, val: boolean) => {
    featureStore.setRegistroField(field, val)
    const updated = { ...useFeatureStore.getState().registroFields, [field]: val }
    await saveSystemSettings({ registroFields: updated })
  }

      // Estados locales para adición de clasificación y uso en personalización
  const [newClasifSettingInput, setNewClasifSettingInput] = useState('')
  const [newUsoSettingInput, setNewUsoSettingInput] = useState('')

  const handleToggleColumnSetting = async (key: string, val: boolean) => {
    toggleMedicamentoColumn(key, val)
    await saveSystemSettings({
      medicamentosColumns: useFeatureStore.getState().medicamentosColumns,
    })
  }

  const handleMoveColumnSetting = async (key: string, dir: 'up' | 'down') => {
    moveMedicamentoColumn(key, dir)
    await saveSystemSettings({
      medicamentosColumns: useFeatureStore.getState().medicamentosColumns,
    })
  }

  const handleAddClasificacionSetting = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = newClasifSettingInput.trim()
    if (!clean) return
    addMedicamentoClasificacion(clean)
    setNewClasifSettingInput('')
    await saveSystemSettings({
      medicamentosClasificaciones: useFeatureStore.getState().medicamentosClasificaciones,
    })
  }

  const handleRemoveClasificacionSetting = async (item: string) => {
    removeMedicamentoClasificacion(item)
    await saveSystemSettings({
      medicamentosClasificaciones: useFeatureStore.getState().medicamentosClasificaciones.filter((c) => c !== item),
    })
  }

  const handleAddUsoSetting = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = newUsoSettingInput.trim()
    if (!clean) return
    addMedicamentoUso(clean)
    setNewUsoSettingInput('')
    await saveSystemSettings({
      medicamentosUsos: useFeatureStore.getState().medicamentosUsos,
    })
  }

  const handleRemoveUsoSetting = async (item: string) => {
    removeMedicamentoUso(item)
    await saveSystemSettings({
      medicamentosUsos: useFeatureStore.getState().medicamentosUsos.filter((u) => u !== item),
    })
  }

  const handleToggleFarmaciaImpresion = async (val: boolean) => {
    setFarmaciaConfig({ imprimirCargo: val })
    await saveSystemSettings({ farmaciaConfig: { ...useFeatureStore.getState().farmaciaConfig, imprimirCargo: val } })
  }

  const handleChangeFarmaciaTipoCargo = async (tipo: 'firma' | 'foto' | 'ambos' | 'ninguno') => {
    setFarmaciaConfig({ tipoCargo: tipo })
    await saveSystemSettings({ farmaciaConfig: { ...useFeatureStore.getState().farmaciaConfig, tipoCargo: tipo } })
  }

  const handleToggleTriaje = async (val: boolean) => {
    setTriajeEnabled(val)
    await saveSystemSettings({ triajeEnabled: val })
  }

  const handleToggleTriajeOption = async (option: any, val: boolean) => {
    featureStore.setTriajeOption(option, val)
    const updated = { ...useFeatureStore.getState().triajeOptions, [option]: val }
    await saveSystemSettings({ triajeOptions: updated })
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

        <button
          onClick={() => setActiveTab('modulos')}
          className={`px-5 py-3 text-[14px] font-bold flex items-center gap-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'modulos'
              ? 'border-primary text-primary bg-surface'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">toggle_on</span>
          <span>4. Activar / Desactivar Módulos</span>
          {!triajeEnabled && (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-error-container text-on-error-container border border-error/30 font-bold ml-1">
              Triaje OFF
            </span>
          )}
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

                {/* Sección: Características y Legibilidad del Ticket Térmico */}
                <div className="pt-4 border-t border-surface-container-high space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">tune</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                      Características de Impresión y Legibilidad del Ticket
                    </h3>
                  </div>

                  {/* Switch para Código QR */}
                  <div className="p-3.5 bg-surface-container-low border border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5 max-w-sm">
                      <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-primary">qr_code_2</span>
                        <span>Código QR en Ticket Térmico</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        Desactive esta opción para <strong>ocultar el QR</strong>, ahorrando papel en rollo y priorizando la visibilidad de los datos del paciente.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                      <input
                        type="checkbox"
                        checked={formData.ticketShowQr}
                        onChange={(e) => setFormData({ ...formData, ticketShowQr: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      <span className="ml-2.5 text-xs font-bold font-mono uppercase text-on-surface">
                        {formData.ticketShowQr ? 'MOSTRAR QR' : 'OCULTAR QR'}
                      </span>
                    </label>
                  </div>

                  {/* Selector de Tamaño de Letra de los Datos del Paciente */}
                  <div className="p-3.5 bg-surface-container-low border border-surface-container-high space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-secondary">format_size</span>
                        <span>Tamaño y Claridad de Datos del Paciente</span>
                      </label>
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 bg-primary-container text-on-primary-container">
                        {formData.ticketPatientFontSize === 'extra-grande'
                          ? 'Extra Grande (18px)'
                          : formData.ticketPatientFontSize === 'grande'
                          ? 'Grande & Clara (15px) • Recomendado'
                          : 'Estándar (11px)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Controla el tamaño tipográfico y contraste con el que se imprimen los datos del paciente (Nombre, DNI, Comunidad, Hora y Médico) para facilitar su lectura en campo por brigadistas y adultos mayores.
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[
                        {
                          val: 'grande',
                          title: 'Grande & Clara',
                          sub: '15px (Recomendado)',
                          icon: 'text_increase',
                        },
                        {
                          val: 'extra-grande',
                          title: 'Extra Grande',
                          sub: '18px (Máxima Visibilidad)',
                          icon: 'title',
                        },
                        {
                          val: 'normal',
                          title: 'Estándar',
                          sub: '11px (Compacto)',
                          icon: 'format_size',
                        },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              ticketPatientFontSize: opt.val as 'normal' | 'grande' | 'extra-grande',
                            })
                          }
                          className={`p-2.5 border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            formData.ticketPatientFontSize === opt.val
                              ? 'bg-primary/10 border-primary ring-1 ring-primary shadow-xs'
                              : 'bg-surface border-surface-container-highest hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="material-symbols-outlined text-base text-primary">
                              {opt.icon}
                            </span>
                            {formData.ticketPatientFontSize === opt.val && (
                              <span className="material-symbols-outlined text-xs text-primary font-bold">
                                check
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 font-bold text-xs text-on-surface">{opt.title}</div>
                          <div className="text-[10px] text-on-surface-variant mt-0.5">{opt.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector de Ancho del Rollo y Centrado */}
                  <div className="p-3.5 bg-surface-container-low border border-surface-container-high space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-primary">straighten</span>
                        <span>Ancho de Rollo y Centrado del Ticket</span>
                      </label>
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 bg-primary-container text-on-primary-container">
                        {formData.ticketPaperWidth === '58mm' ? '58mm (Portátil)' : '80mm (Estándar POS)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      El sistema calcula el centrado automático para que los bordes y textos salgan perfectamente centrados y no se corten en ningún lateral del papel.
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {[
                        { val: '80mm', title: '80mm (Estándar POS)', sub: 'Impresoras de mostrador (Epson, Star, Bixolon)' },
                        { val: '58mm', title: '58mm (Portátil / Mini)', sub: 'Impresoras móviles bluetooth compactas' },
                      ].map((pw) => (
                        <button
                          key={pw.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, ticketPaperWidth: pw.val as '80mm' | '58mm' })}
                          className={`p-2.5 border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            formData.ticketPaperWidth === pw.val
                              ? 'bg-primary/10 border-primary ring-1 ring-primary shadow-xs'
                              : 'bg-surface border-surface-container-highest hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-on-surface">{pw.title}</span>
                            {formData.ticketPaperWidth === pw.val && (
                              <span className="material-symbols-outlined text-xs text-primary font-bold">check</span>
                            )}
                          </div>
                          <div className="text-[10px] text-on-surface-variant mt-0.5">{pw.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
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
                    {formData.ticketPaperWidth || '80mm'} • Centrado Activo
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

                  {/* Patient Info with Dynamic Font Size and Clarity */}
                  <div
                    className={`my-2.5 border-y-2 border-black py-2 text-black ${
                      formData.ticketPatientFontSize === 'extra-grande'
                        ? 'space-y-2'
                        : formData.ticketPatientFontSize === 'normal'
                        ? 'space-y-1'
                        : 'space-y-1.5'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-wider text-black">
                        PACIENTE:
                      </span>
                      <span
                        className={`font-black text-black leading-tight uppercase ${
                          formData.ticketPatientFontSize === 'extra-grande'
                            ? 'text-lg'
                            : formData.ticketPatientFontSize === 'normal'
                            ? 'text-xs'
                            : 'text-base'
                        }`}
                      >
                        MAMANI QUISPE, ROSA
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                      <span className="font-black text-black text-[11px] uppercase">DNI:</span>
                      <strong
                        className={`font-mono font-black text-black ${
                          formData.ticketPatientFontSize === 'extra-grande'
                            ? 'text-base'
                            : formData.ticketPatientFontSize === 'normal'
                            ? 'text-xs'
                            : 'text-sm'
                        }`}
                      >
                        02817462
                      </strong>
                    </div>

                    <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                      <span className="font-black text-black text-[11px] uppercase">EDAD / SEXO:</span>
                      <span
                        className={`font-bold text-black uppercase ${
                          formData.ticketPatientFontSize === 'extra-grande' ? 'text-sm' : 'text-xs'
                        }`}
                      >
                        67 AÑOS • FEMENINO
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                      <span className="font-black text-black text-[11px] uppercase">DESTINO:</span>
                      <span
                        className={`font-bold text-black uppercase ${
                          formData.ticketPatientFontSize === 'extra-grande' ? 'text-sm' : 'text-xs'
                        }`}
                      >
                        CONSULTORIO 01 • 09:15
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                      <span className="font-black text-black text-[11px] uppercase">MÉDICO:</span>
                      <span
                        className={`font-bold text-black uppercase ${
                          formData.ticketPatientFontSize === 'extra-grande' ? 'text-sm' : 'text-xs'
                        }`}
                      >
                        DR. MARCO HUAMAN QUISPE
                      </span>
                    </div>
                  </div>

                  {/* QR Code Simulado (Condicionado a ticketShowQr) */}
                  {formData.ticketShowQr && (
                    <div className="text-center my-2.5 pt-1 border-t border-dashed border-black">
                      <div className="w-24 h-24 mx-auto border-2 border-black flex flex-col items-center justify-center p-1 bg-white">
                        <span className="material-symbols-outlined text-4xl text-black">qr_code_2</span>
                        <span className="text-[8px] font-mono font-black text-black uppercase">
                          QR CLÍNICO
                        </span>
                      </div>
                      <div className="text-[9px] font-bold mt-1 text-black uppercase">
                        Valide este QR en su atención clínica
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="text-[10px] text-center text-black font-bold uppercase leading-tight pt-2 border-t border-black">
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

        {/* TAB 4: ACTIVACIÓN Y DESACTIVACIÓN DE MÓDULOS */}
        {activeTab === 'modulos' && (
          <div className="space-y-6">
            {/* Banner Informativo */}
            <div className="p-4 bg-surface border border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-2xl mt-0.5">tune</span>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface">
                    Gestión Modular de la Brigada Clínica
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                    Active o desactive los módulos operativos del sistema según las necesidades del campamento médico.
                    Si desactiva un módulo, la opción no se elimina pero su toma de datos se deshabilita para agilizar la atención.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-secondary">Estado Global:</span>
                <span className={`px-2.5 py-1 text-xs font-bold uppercase font-mono ${
                  triajeEnabled ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-on-error-container'
                }`}>
                  {triajeEnabled ? 'Triaje Activo' : 'Triaje Desactivado'}
                </span>
              </div>
            </div>

            {/* Tarjeta Principal: MÓDULO DE TRIAJE */}
            <div className={`p-6 border-2 transition-all ${
              triajeEnabled
                ? 'bg-surface border-tertiary shadow-xs'
                : 'bg-surface-container-low border-surface-container-high'
            }`}>
              {/* Switch Principal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-container-high">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl text-primary">vital_signs</span>
                    <h3 className="text-base font-bold text-on-surface uppercase tracking-wide">
                      Módulo de Triaje &amp; Signos Vitales
                    </h3>
                  </div>
                  <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
                    Controla la toma y evaluación de signos vitales (presión arterial, pulso, temperatura, oximetría, somatometría).
                    Cuando está <strong>desactivado</strong>, los pacientes registrados en Admisión pasan directamente a la atención de consulta médica sin retención obligatoria en la carpa de triaje.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                  <input
                    type="checkbox"
                    checked={triajeEnabled}
                    onChange={(e) => handleToggleTriaje(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-tertiary"></div>
                  <span className="ml-3 text-xs font-bold font-mono uppercase tracking-wider text-on-surface">
                    {triajeEnabled ? 'ACTIVADO' : 'DESACTIVADO'}
                  </span>
                </label>
              </div>

              {/* Sub-opciones dentro del Módulo de Triaje */}
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary">checklist</span>
                    <span>Opciones y Formularios Específicos Dentro de Triaje</span>
                  </h4>
                  <span className="text-[11px] text-on-surface-variant font-mono">
                    {triajeEnabled ? 'Configurables en tiempo real' : 'Se aplicarán al activar el módulo'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Sub-opción: Somatometría */}
                  <label className={`p-3.5 border flex items-start gap-3 cursor-pointer transition-colors ${
                    triajeOptions.somatometria ? 'bg-surface border-primary/40' : 'bg-surface-container border-surface-container-high opacity-75'
                  }`}>
                    <input
                      type="checkbox"
                      checked={triajeOptions.somatometria}
                      onChange={(e) => handleToggleTriajeOption('somatometria', e.target.checked)}
                      className="mt-0.5 accent-primary h-4 w-4 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-on-surface">
                        Somatometría Antropométrica (Peso, Talla e IMC)
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                        Calcula automáticamente el Índice de Masa Corporal y clasifica según normativas OMS en campamento.
                      </div>
                    </div>
                  </label>

                  {/* Sub-opción: Signos Vitales Básicos */}
                  <label className={`p-3.5 border flex items-start gap-3 cursor-pointer transition-colors ${
                    triajeOptions.signosVitales ? 'bg-surface border-primary/40' : 'bg-surface-container border-surface-container-high opacity-75'
                  }`}>
                    <input
                      type="checkbox"
                      checked={triajeOptions.signosVitales}
                      onChange={(e) => handleToggleTriajeOption('signosVitales', e.target.checked)}
                      className="mt-0.5 accent-primary h-4 w-4 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-on-surface">
                        Signos Vitales Básicos (Presión, FC y Temperatura)
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                        PA Sistólica / Diastólica con alertas de crisis hipertensiva, pulso y termometría clínica.
                      </div>
                    </div>
                  </label>

                  {/* Sub-opción: Oximetría y Frecuencia Respiratoria */}
                  <label className={`p-3.5 border flex items-start gap-3 cursor-pointer transition-colors ${
                    triajeOptions.oximetriaRespiracion ? 'bg-surface border-primary/40' : 'bg-surface-container border-surface-container-high opacity-75'
                  }`}>
                    <input
                      type="checkbox"
                      checked={triajeOptions.oximetriaRespiracion}
                      onChange={(e) => handleToggleTriajeOption('oximetriaRespiracion', e.target.checked)}
                      className="mt-0.5 accent-primary h-4 w-4 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-on-surface">
                        Oximetría y Respiración (SpO2 en Altura y FR)
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                        Monitoreo de saturación de oxígeno adaptado a zonas rurales andinas y frecuencia respiratoria.
                      </div>
                    </div>
                  </label>

                  {/* Sub-opción: Exámenes Auxiliares */}
                  <label className={`p-3.5 border flex items-start gap-3 cursor-pointer transition-colors ${
                    triajeOptions.examenesAuxiliares ? 'bg-surface border-primary/40' : 'bg-surface-container border-surface-container-high opacity-75'
                  }`}>
                    <input
                      type="checkbox"
                      checked={triajeOptions.examenesAuxiliares}
                      onChange={(e) => handleToggleTriajeOption('examenesAuxiliares', e.target.checked)}
                      className="mt-0.5 accent-primary h-4 w-4 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-on-surface">
                        Pruebas Auxiliares Rápidas (Glucosa Capilar y Glasgow)
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                        Glucómetro digital rápido y evaluación de nivel de consciencia en la carpa de clasificación.
                      </div>
                    </div>
                  </label>

                  {/* Sub-opción: Impresión de Ticket Térmico en Triaje */}
                  <label className={`p-3.5 border flex items-start gap-3 cursor-pointer transition-colors md:col-span-2 ${
                    triajeOptions.imprimirTicketTriaje ? 'bg-surface border-primary/40' : 'bg-surface-container border-surface-container-high opacity-75'
                  }`}>
                    <input
                      type="checkbox"
                      checked={triajeOptions.imprimirTicketTriaje}
                      onChange={(e) => handleToggleTriajeOption('imprimirTicketTriaje', e.target.checked)}
                      className="mt-0.5 accent-primary h-4 w-4 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-on-surface flex items-center gap-2">
                        <span>Emisión de Ticket Físico en Box de Triaje</span>
                        <span className="material-symbols-outlined text-sm text-primary">print</span>
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                        Permite imprimir el ticket térmico con QR clínico una vez registrados los signos vitales. Si está desactivado, el ticket original entregado en Admisión continúa como único comprobante.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Módulos Adicionales del Sistema */}
            <div className="bg-surface p-6 border border-surface-container-high space-y-4">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-secondary">grid_view</span>
                <span>Otros Módulos Clínicos Disponibles en la Campaña</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-surface-container-low border border-surface-container-high flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-on-surface">Consulta Médica Especializada</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">Diagnóstico, evolución clínica y receta</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consultaEnabled}
                      onChange={(e) => setModuleEnabled('consulta', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="p-4 bg-surface-container-low border border-surface-container-high flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-on-surface">Farmacia &amp; Entrega de Medicamentos</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">Dispensación de fármacos con stock</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={farmaciaEnabled}
                      onChange={(e) => setModuleEnabled('farmacia', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            
            {/* CONFIGURACIÓN DE FARMACIA & CARGO DE ENTREGA */}
            <div className="bg-surface p-6 border-2 border-emerald-600/40 shadow-xs space-y-5">
              <div className="flex items-start gap-3 border-b border-surface-container-high pb-4">
                <span className="material-symbols-outlined text-emerald-600 text-2xl mt-0.5">local_pharmacy</span>
                <div>
                  <h3 className="text-base font-bold text-on-surface uppercase tracking-wide">
                    Configuración de Farmacia &amp; Cargo de Entrega
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                    Personalice si se debe imprimir comprobante de entrega para el paciente y qué tipo de evidencia (firma digital, fotografía o ninguna) se solicitará al momento de despachar los medicamentos con receta médica.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Switch de Impresión */}
                <div className={`p-4 border transition-all ${
                  farmaciaConfig.imprimirCargo
                    ? 'bg-surface border-emerald-500 shadow-xs'
                    : 'bg-surface-container-low border-surface-container-high opacity-80'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-emerald-600">print</span>
                        Imprimir Cargo de Entrega
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-1">
                        Genera e imprime comprobante térmico con el detalle de fármacos despachados, doctor prescriptor y datos del beneficiario.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none ml-3">
                      <input
                        type="checkbox"
                        checked={farmaciaConfig.imprimirCargo}
                        onChange={(e) => handleToggleFarmaciaImpresion(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                {/* Selector de Tipo de Evidencia */}
                <div className="p-4 border border-surface-container-high bg-surface space-y-2">
                  <div className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">verified</span>
                    Modalidad de Evidencia / Cargo
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    Seleccione cómo debe registrarse la constancia de recepción de los fármacos:
                  </div>
                  <select
                    value={farmaciaConfig.tipoCargo}
                    onChange={(e) => handleChangeFarmaciaTipoCargo(e.target.value as any)}
                    className="w-full mt-2 p-2.5 bg-surface-container-low border border-surface-container-highest text-xs font-semibold text-on-surface focus:border-primary focus:outline-none"
                  >
                    <option value="firma">Firma Digital en Pantalla táctil / Mouse</option>
                    <option value="foto">Foto de Evidencia (Cámara web / Móvil)</option>
                    <option value="ambos">Firma Digital + Foto de Evidencia</option>
                    <option value="ninguno">Sin Evidencia (Dispensación Rápida Directa)</option>
                  </select>
                </div>
              </div>
            </div>

            
            {/* SECCIÓN NUEVA: PERSONALIZACIÓN DEL CRUD DE MEDICAMENTOS, COLUMNAS, CLASIFICACIONES Y USOS */}
            <div className="bg-surface p-6 border-2 border-primary/40 shadow-xs space-y-6">
              <div className="flex items-start gap-3 border-b border-surface-container-high pb-4">
                <span className="material-symbols-outlined text-primary text-2xl mt-0.5">medication</span>
                <div>
                  <h3 className="text-base font-bold text-on-surface uppercase tracking-wide">
                    Personalización del Catálogo y CRUD de Medicamentos
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                    Personalice qué columnas se visualizan en la lista de medicamentos y modifique el orden en que aparecen.
                    Asimismo, administre el catálogo maestro de <strong>Clasificaciones Terapéuticas</strong> (para qué sirve: Antiflatulento, Antitusivo, etc.) y de <strong>Usos / Población</strong> (Pediátrico, Adultos, etc.).
                  </p>
                </div>
              </div>

              {/* BLOQUE A: CONFIGURACIÓN DE COLUMNAS (VISIBILIDAD Y ORDEN) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">view_column</span>
                    <span>Columnas del CRUD de Medicamentos (Visibilidad y Orden)</span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    Use las flechas ▲ ▼ para reordenar y el switch para activar u ocultar.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[...medicamentosColumns]
                    .sort((a, b) => a.order - b.order)
                    .map((col, idx, arr) => (
                      <div
                        key={col.key}
                        className={`p-3 border flex items-center justify-between gap-3 transition-colors ${
                          col.visible
                            ? 'bg-surface border-primary/30 shadow-2xs'
                            : 'bg-surface-container-low border-surface-container-high opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 bg-surface-container-highest text-on-surface text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                            #{col.order}
                          </span>
                          <div className="truncate">
                            <span className="text-xs font-bold text-on-surface truncate block">
                              {col.label}
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-mono">
                              {col.key === 'clasificacion'
                                ? 'Inicio de lista (Acción terapéutica)'
                                : col.key === 'uso'
                                ? 'Final de lista (Pediátrico / Adultos)'
                                : `Campo: ${col.key}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Botones de Reordenar */}
                          <div className="flex items-center border border-surface-container-highest bg-surface">
                            <button
                              type="button"
                              onClick={() => handleMoveColumnSetting(col.key, 'up')}
                              disabled={idx === 0}
                              className="px-1.5 py-0.5 text-on-surface-variant hover:text-primary disabled:opacity-30 cursor-pointer"
                              title="Subir / Mover antes"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveColumnSetting(col.key, 'down')}
                              disabled={idx === arr.length - 1}
                              className="px-1.5 py-0.5 text-on-surface-variant hover:text-primary disabled:opacity-30 cursor-pointer"
                              title="Bajar / Mover después"
                            >
                              ▼
                            </button>
                          </div>

                          {/* Switch de Visibilidad */}
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={col.visible}
                              onChange={(e) => handleToggleColumnSetting(col.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* BLOQUE B: GESTIÓN DE CLASIFICACIONES TERAPÉUTICAS */}
              <div className="p-4 bg-surface-container-low border border-surface-container-high space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-primary">category</span>
                      <span>Catálogo Maestro de Clasificaciones (Para qué es)</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      Opciones disponibles en el selector al crear o editar medicamentos (Antiflatulento, Antitusivo, etc.)
                    </div>
                  </div>

                  <form onSubmit={handleAddClasificacionSetting} className="flex gap-1.5 shrink-0">
                    <input
                      type="text"
                      placeholder="Nueva clasificación..."
                      value={newClasifSettingInput}
                      onChange={(e) => setNewClasifSettingInput(e.target.value)}
                      className="h-8 px-2.5 text-xs bg-surface border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 h-8 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Agregar</span>
                    </button>
                  </form>
                </div>

                {/* Chips de Clasificaciones */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {medicamentosClasificaciones.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface border border-surface-container-highest text-xs font-medium text-on-surface shadow-2xs"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveClasificacionSetting(item)}
                        className="text-on-surface-variant hover:text-error cursor-pointer ml-0.5"
                        title="Eliminar de la lista"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* BLOQUE C: GESTIÓN DE USOS / POBLACIÓN DESTINO */}
              <div className="p-4 bg-surface-container-low border border-surface-container-high space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-secondary">groups</span>
                      <span>Catálogo Maestro de Usos / Población Destino</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      Poblaciones clínicas asignadas al fármaco (Pediátrico, Adultos, Geriátrico, etc.)
                    </div>
                  </div>

                  <form onSubmit={handleAddUsoSetting} className="flex gap-1.5 shrink-0">
                    <input
                      type="text"
                      placeholder="Nuevo uso..."
                      value={newUsoSettingInput}
                      onChange={(e) => setNewUsoSettingInput(e.target.value)}
                      className="h-8 px-2.5 text-xs bg-surface border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 h-8 bg-secondary text-on-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Agregar</span>
                    </button>
                  </form>
                </div>

                {/* Chips de Usos */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {medicamentosUsos.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface border border-surface-container-highest text-xs font-medium text-on-surface shadow-2xs"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUsoSetting(item)}
                        className="text-on-surface-variant hover:text-error cursor-pointer ml-0.5"
                        title="Eliminar de la lista"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* SECCIÓN NUEVA: PERSONALIZACIÓN DE CAMPOS DEL REGISTRO DE BENEFICIARIOS */}
            <div className="bg-surface p-6 border-2 border-primary/40 shadow-xs space-y-6">
              <div className="flex items-start gap-3 border-b border-surface-container-high pb-4">
                <span className="material-symbols-outlined text-primary text-2xl mt-0.5">app_registration</span>
                <div>
                  <h3 className="text-base font-bold text-on-surface uppercase tracking-wide">
                    Personalización de Campos del Registro (Admisión / Acreditación)
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                    Configure qué datos y secciones se solicitarán al paciente durante su registro de campaña.
                    Por ejemplo, para campañas de atención rápida o pediátricas masivas, puede desactivar la <strong>Sección 3 de Antecedentes y Factores de Riesgo</strong> o campos específicos según la necesidad operativa.
                  </p>
                </div>
              </div>

              {/* Bloque 1: SECCIÓN 3 - ANTECEDENTES Y FACTORES DE RIESGO */}
              <div className={`p-5 border-2 transition-all ${
                registroFields.seccionAntecedentes
                  ? 'bg-surface border-primary shadow-xs'
                  : 'bg-surface-container-low border-surface-container-high opacity-85'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-container-high">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
                        3
                      </span>
                      <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                        Sección 3: Antecedentes &amp; Factores de Riesgo Crónico
                      </h4>
                      <span className={`px-2 py-0.5 text-[10px] font-bold font-mono uppercase ${
                        registroFields.seccionAntecedentes
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-error-container text-on-error-container'
                      }`}>
                        {registroFields.seccionAntecedentes ? 'Habilitada' : 'Oculta en Campaña'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
                      Si desactiva este switch, la <strong>Sección 3 completa de Antecedentes</strong> no se mostrará en la pantalla de registro, permitiendo registrar pacientes en menor tiempo.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                    <input
                      type="checkbox"
                      checked={registroFields.seccionAntecedentes}
                      onChange={(e) => handleToggleAntecedentes(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                    <span className="ml-3 text-xs font-bold font-mono uppercase text-on-surface">
                      {registroFields.seccionAntecedentes ? 'MOSTRAR' : 'OCULTAR'}
                    </span>
                  </label>
                </div>

                {/* Sub-campos de la Sección 3 */}
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] font-bold text-on-surface uppercase tracking-wider">
                    Campos Específicos de Tamizaje en Sección 3 (Visibles cuando la sección esté activa):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {[
                      { key: 'hipertension', label: 'Hipertensión Arterial', desc: 'Presión en triaje' },
                      { key: 'diabetes', label: 'Diabetes Mellitus', desc: 'Glucosa recomendada' },
                      { key: 'asma', label: 'Asma / EPOC / Silicosis', desc: 'Exposición a humo/minas' },
                      { key: 'anemia', label: 'Desnutrición / Anemia', desc: 'Dosaje de Hb' },
                      { key: 'gestante', label: 'Embarazo / Gestante', desc: 'Prioridad obstétrica' },
                      { key: 'alergias', label: 'Alergias Medicamentosas', desc: 'Fármacos reactivos' },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className={`p-3 border flex items-start gap-2.5 cursor-pointer text-xs transition-colors ${
                          registroFields[item.key as keyof typeof registroFields]
                            ? 'bg-surface border-primary/30'
                            : 'bg-surface-container border-surface-container-high opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(registroFields[item.key as keyof typeof registroFields])}
                          onChange={(e) => handleToggleField(item.key as any, e.target.checked)}
                          disabled={!registroFields.seccionAntecedentes}
                          className="mt-0.5 accent-primary h-4 w-4 cursor-pointer"
                        />
                        <div>
                          <div className="font-semibold text-on-surface">{item.label}</div>
                          <div className="text-[10px] text-on-surface-variant">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bloque 2: SECCIÓN 2 - DATOS DE RESIDENCIA Y CONTACTO */}
              <div className={`p-5 border-2 transition-all ${
                registroFields.seccionResidencia
                  ? 'bg-surface border-secondary shadow-xs'
                  : 'bg-surface-container-low border-surface-container-high opacity-85'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-container-high">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
                        2
                      </span>
                      <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                        Sección 2: Datos de Residencia y Contacto Comunitario
                      </h4>
                      <span className={`px-2 py-0.5 text-[10px] font-bold font-mono uppercase ${
                        registroFields.seccionResidencia
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-error-container text-on-error-container'
                      }`}>
                        {registroFields.seccionResidencia ? 'Habilitada' : 'Oculta en Campaña'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
                      Controla la captura de comunidad rural, número de WhatsApp/celular, altitud en msnm, tiempo de traslado y afiliación SIS/EsSalud.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                    <input
                      type="checkbox"
                      checked={registroFields.seccionResidencia}
                      onChange={(e) => handleToggleResidencia(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                    <span className="ml-3 text-xs font-bold font-mono uppercase text-on-surface">
                      {registroFields.seccionResidencia ? 'MOSTRAR' : 'OCULTAR'}
                    </span>
                  </label>
                </div>

                {/* Sub-campos de la Sección 2 */}
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] font-bold text-on-surface uppercase tracking-wider">
                    Campos Individuales de la Sección 2:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {[
                      { key: 'comunidad', label: 'Comunidad / Sector Rural' },
                      { key: 'telefono', label: 'Móvil / WhatsApp de Contacto' },
                      { key: 'altitud', label: 'Altitud Habitual (msnm)' },
                      { key: 'tiempoViaje', label: 'Tiempo de Traslado a pie' },
                      { key: 'seguro', label: 'Afiliación a Seguro Médico' },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className={`p-3 border flex items-center gap-2.5 cursor-pointer text-xs transition-colors ${
                          registroFields[item.key as keyof typeof registroFields]
                            ? 'bg-surface border-primary/30'
                            : 'bg-surface-container border-surface-container-high opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(registroFields[item.key as keyof typeof registroFields])}
                          onChange={(e) => handleToggleField(item.key as any, e.target.checked)}
                          disabled={!registroFields.seccionResidencia}
                          className="accent-primary h-4 w-4 cursor-pointer"
                        />
                        <span className="font-semibold text-on-surface">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bloque 3: SECCIÓN 1 - DATOS COMPLEMENTARIOS */}
              <div className="p-5 border border-surface-container-high bg-surface space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                    Sección 1: Campos Complementarios de Identificación
                  </h4>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Los campos esenciales (DNI, Nombres, Apellidos, Fecha de Nacimiento y Sexo) son siempre requeridos para la emisión del ticket clínico. Puede activar o desactivar los siguientes datos adicionales:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="p-3 border border-surface-container-high bg-surface-container-low flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={registroFields.estadoCivil}
                      onChange={(e) => handleToggleField('estadoCivil', e.target.checked)}
                      className="accent-primary h-4 w-4 cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold text-on-surface">Estado Civil</span>
                      <div className="text-[10px] text-on-surface-variant">Conviviente, Casado, Soltero, Viudo</div>
                    </div>
                  </label>

                  <label className="p-3 border border-surface-container-high bg-surface-container-low flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={registroFields.lenguaMaterna}
                      onChange={(e) => handleToggleField('lenguaMaterna', e.target.checked)}
                      className="accent-primary h-4 w-4 cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold text-on-surface">Lengua Materna</span>
                      <div className="text-[10px] text-on-surface-variant">Quechua Collao, Castellano, Aimara, Bilingüe</div>
                    </div>
                  </label>
                </div>
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
