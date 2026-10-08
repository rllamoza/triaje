import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useLogin, useLoginPin } from '../../api/hooks'
import { useAuthStore } from '../../store/authStore'
import { useBrandingStore } from '../../store/brandingStore'
import { HardwareStatusBar } from '../../components/common/HardwareStatusBar'
import { AppFooter } from '../../components/layout/AppFooter'
import { useCampaignGeolocation } from '../../hooks/useCampaignGeolocation'

type LoginMode = 'credential' | 'pin'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isAuth = useAuthStore((s) => s.isAuthenticated())
  const branding = useBrandingStore()

  // Dynamic Geolocation & Nearest Campaign calculation
  const {
    campaigns,
    nearestCampaign,
    selectedCampaign,
    selectedCampaignId,
    selectCampaign,
    resetToNearest,
    coords,
    geoStatus,
    geoMessage,
    requestSmartphoneLocation,
    setSimulatedLocation,
    presetLocations,
  } = useCampaignGeolocation(1)

  if (isAuth) {
    return <Navigate to="/" replace />
  }

  const [mode, setMode] = useState<LoginMode>('credential')
  const [credential, setCredential] = useState('admin@semilla.pe')
  const [password, setPassword] = useState('Admin2025!')
  const [role, setRole] = useState('admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // PIN
  const [pin, setPin] = useState(['1', '2', '3', '4'])
  const [responsable, setResponsable] = useState('Dr. M. Benavides (Med. General)')
  const [pinError, setPinError] = useState('')

  // Stations
  const [selectedStation, setSelectedStation] = useState('ADM-01')

  const loginMutation = useLogin()
  const pinMutation = useLoginPin()

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await loginMutation.mutateAsync({
        credential,
        password,
        campaign_id: selectedCampaignId,
        station_id: selectedStation,
      })
      setAuth({ ...data, campaign_id: selectedCampaignId, station_id: selectedStation })
      navigate('/admision')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Credenciales inválidas. Compruebe usuario y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setPinError('')
    const fullPin = pin.join('')
    if (fullPin.length < 4) {
      setPinError('Ingrese el PIN completo de 4 dígitos')
      return
    }
    setLoading(true)
    try {
      const data = await pinMutation.mutateAsync({
        pin: fullPin,
        responsable,
        campaign_id: selectedCampaignId,
      })
      setAuth({ ...data, campaign_id: selectedCampaignId, station_id: selectedStation })
      navigate('/queue')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setPinError(msg ?? 'PIN de guardia inválido. Intente con 1234, 8247 o 5519.')
    } finally {
      setLoading(false)
    }
  }

  const handlePinChange = (idx: number, val: string) => {
    const clean = val.replace(/\D/g, '')
    if (!clean) {
      const next = [...pin]
      next[idx] = ''
      setPin(next)
      return
    }
    if (clean.length > 1) {
      const digits = clean.slice(0, 4).split('')
      const next = [...pin]
      digits.forEach((d, i) => {
        if (idx + i < 4) next[idx + i] = d
      })
      setPin(next)
      const nextFocus = Math.min(3, idx + digits.length)
      document.getElementById(`pin-box-${nextFocus}`)?.focus()
      return
    }
    const next = [...pin]
    next[idx] = clean
    setPin(next)
    if (idx < 3) {
      document.getElementById(`pin-box-${idx + 1}`)?.focus()
    }
  }

  const handlePinKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) {
      document.getElementById(`pin-box-${idx - 1}`)?.focus()
    }
  }

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (text) {
      const next = ['', '', '', '']
      text.split('').forEach((d, i) => {
        next[i] = d
      })
      setPin(next)
      document.getElementById(`pin-box-${Math.min(3, text.length)}`)?.focus()
    }
  }

  const handleSelectPinPreset = (presetPin: string, presetResponsable: string) => {
    setPin(presetPin.split(''))
    setResponsable(presetResponsable)
    setPinError('')
  }

  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col">
      {/* Top Hardware Telemetry Bar */}
      <HardwareStatusBar
        variant="full"
        locationOverride={selectedCampaign?.location_name}
      />

      {/* Main Split Grid */}
      <div className="w-full grid grid-cols-12 min-h-[calc(100vh-42px)] flex-1">
        {/* Left Column: Login Form */}
        <div className="col-span-12 lg:col-span-5 bg-surface p-8 lg:p-12 flex flex-col justify-between border-r border-surface-container-high">
          <div className="space-y-6">
            {/* Brand Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex-shrink-0 bg-inverse-surface flex items-center justify-center p-1.5 shadow-sm">
                {branding.isotipoUrl || branding.logoUrl ? (
                  <img
                    alt={branding.appName}
                    className="w-full h-full object-contain"
                    src={branding.isotipoUrl || branding.logoUrl}
                  />
                ) : (
                  <span className="material-symbols-outlined text-white text-2xl">local_hospital</span>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-primary font-semibold">
                  {branding.loginTitle}
                </div>
                <h1 className="text-2xl font-semibold text-on-surface tracking-tight">
                  {branding.appName} • Asistencia Médica
                </h1>
                <p className="text-xs text-secondary mt-0.5">
                  {branding.loginSubtitle}
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-surface-container p-1 gap-1 border border-surface-container-high">
              <button
                type="button"
                className={`flex-1 py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 rounded-none cursor-pointer ${
                  mode === 'credential'
                    ? 'text-on-surface bg-surface shadow-xs border border-surface-container-high'
                    : 'text-secondary hover:text-on-surface'
                }`}
                onClick={() => setMode('credential')}
              >
                <span className="material-symbols-outlined text-base text-primary">badge</span>
                Credencial Médica
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 rounded-none cursor-pointer ${
                  mode === 'pin'
                    ? 'text-on-surface bg-surface shadow-xs border border-surface-container-high'
                    : 'text-secondary hover:text-on-surface'
                }`}
                onClick={() => setMode('pin')}
              >
                <span className="material-symbols-outlined text-base text-error">emergency</span>
                Guardia / PIN Rápido
              </button>
            </div>

            {/* Credential Form */}
            {mode === 'credential' ? (
              <form className="space-y-4" onSubmit={handleCredentialLogin}>
                {error && (
                  <div className="p-3 bg-error-container text-on-error-container text-xs flex items-center gap-2 border border-error/30">
                    <span className="material-symbols-outlined text-error text-base">error</span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    DNI o Código de Colegiado
                  </label>
                  <div className="relative bg-surface-container flex items-center border border-surface-container-high focus-within:border-primary focus-within:bg-surface transition-colors">
                    <span className="material-symbols-outlined absolute left-3 text-secondary text-lg">person</span>
                    <input
                      className="w-full bg-transparent py-2.5 pl-10 pr-3 text-xs text-on-surface focus:outline-none font-mono placeholder:text-secondary/60 rounded-none"
                      placeholder="Ej. 45892301 ó CMP-89241"
                      type="text"
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Contraseña Segura
                    </label>
                    <span className="text-xs text-primary cursor-pointer hover:underline font-mono">Token Físico</span>
                  </div>
                  <div className="relative bg-surface-container flex items-center border border-surface-container-high focus-within:border-primary focus-within:bg-surface transition-colors">
                    <span className="material-symbols-outlined absolute left-3 text-secondary text-lg">lock</span>
                    <input
                      className="w-full bg-transparent py-2.5 pl-10 pr-3 text-xs text-on-surface focus:outline-none font-mono rounded-none"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Rol Funcional en Carpa
                  </label>
                  <div className="relative bg-surface-container flex items-center border border-surface-container-high focus-within:border-primary">
                    <span className="material-symbols-outlined absolute left-3 text-secondary text-lg">medical_services</span>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-transparent py-2.5 pl-10 pr-8 text-xs text-on-surface focus:outline-none appearance-none font-medium cursor-pointer rounded-none"
                    >
                      <option value="admin">Administrador General de Operaciones</option>
                      <option value="medico">Médico Evaluador / Especialista</option>
                      <option value="triaje">Enfermería de Triaje &amp; Somatometría</option>
                      <option value="admision">Admisión, Filiación &amp; Empadronamiento</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 text-secondary pointer-events-none text-base">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Quick hardware reader badges */}
                <div className="bg-surface-container-low p-3.5 space-y-2.5 border border-surface-container-high">
                  <div className="text-xs font-semibold text-on-surface flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">contactless</span>
                      Validación Rápida de Campo
                    </span>
                    <span className="text-[10px] text-tertiary bg-tertiary-container px-1.5 py-0.5 font-mono">
                      LECTOR DNIe LISTO
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="bg-surface hover:bg-surface-container border border-surface-container-high p-2 text-left flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-secondary text-base">fingerprint</span>
                      <span className="text-xs text-on-surface font-medium">Lector Biométrico</span>
                    </button>
                    <button
                      type="button"
                      className="bg-surface hover:bg-surface-container border border-surface-container-high p-2 text-left flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-secondary text-base">nfc</span>
                      <span className="text-xs text-on-surface font-medium">Aproximar DNIe</span>
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    defaultChecked
                    type="checkbox"
                    className="mt-0.5 accent-primary h-4 w-4 rounded-none cursor-pointer"
                  />
                  <span className="text-xs text-on-surface-variant leading-tight">
                    Guardar credenciales en este nodo local para operar en contingencia Mesh sin conexión WAN.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-semibold py-3 px-4 text-xs uppercase tracking-wider flex items-center justify-between transition-colors shadow-xs rounded-none cursor-pointer"
                >
                  <span>{loading ? 'Validando credenciales...' : 'Iniciar Sesión e Ingresar al Puesto'}</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>

                <div className="pt-3 border-t border-surface-container-high text-center">
                  <p className="text-[11px] text-secondary mb-2">
                    ¿Te integras como voluntario o profesional a la campaña?
                  </p>
                  <Link
                    to="/registro-voluntario"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-surface hover:bg-surface-container border border-primary/40 text-primary text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">volunteer_activism</span>
                    <span>Registrarse como Voluntario (6 Roles)</span>
                  </Link>
                </div>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handlePinLogin}>
                {pinError && (
                  <div className="p-3 bg-error-container text-on-error-container text-xs flex items-center gap-2 border border-error/30">
                    <span className="material-symbols-outlined text-error text-base">error</span>
                    <span>{pinError}</span>
                  </div>
                )}

                <div className="bg-error-container p-3.5 border border-error/30">
                  <div className="flex items-center gap-2 text-error font-bold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base">warning</span>
                    Modo Guardia de Emergencia
                  </div>
                  <p className="text-xs text-on-error-container mt-1 leading-snug">
                    Habilitado exclusivamente para atención crítica inmediata ante caída severa de red en triaje rural.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      PIN de Contingencia (4 Dígitos)
                    </label>
                    <span className="text-[11px] text-secondary font-mono">
                      Admin: 1234
                    </span>
                  </div>
                  <div className="flex justify-center gap-3">
                    {[0, 1, 2, 3].map((i) => (
                      <input
                        key={i}
                        id={`pin-box-${i}`}
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={pin[i]}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handlePinChange(i, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(i, e)}
                        onPaste={handlePinPaste}
                        className="w-12 h-14 bg-surface-container border border-surface-container-high text-center text-2xl font-mono font-bold text-on-surface focus:bg-surface focus:border-primary focus:outline-none rounded-none shadow-xs"
                      />
                    ))}
                  </div>

                  {/* Quick Preset PIN Chips */}
                  <div className="pt-2">
                    <div className="text-[11px] text-on-surface-variant mb-1.5 font-medium">
                      PINs rápidos configurados:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectPinPreset('1234', 'Dr. Administrador de Guardia')}
                        className="px-2 py-1 bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-[11.5px] font-mono text-on-surface cursor-pointer rounded-xs"
                      >
                        ⚡ 1234 (Admin)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPinPreset('8247', 'Dr. Marco Huamán Quispe')}
                        className="px-2 py-1 bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-[11.5px] font-mono text-on-surface cursor-pointer rounded-xs"
                      >
                        🩺 8247 (Médico)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPinPreset('5519', 'Lic. Sofía Benavides Roca')}
                        className="px-2 py-1 bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-[11.5px] font-mono text-on-surface cursor-pointer rounded-xs"
                      >
                        📋 5519 (Triaje)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Responsable de Guardia
                  </label>
                  <div className="relative bg-surface-container flex items-center border border-surface-container-high">
                    <span className="material-symbols-outlined absolute left-3 text-secondary text-lg">supervised_user_circle</span>
                    <input
                      className="w-full bg-transparent py-2.5 pl-10 pr-3 text-xs text-on-surface focus:outline-none rounded-none"
                      type="text"
                      value={responsable}
                      onChange={(e) => setResponsable(e.target.value)}
                      placeholder="Nombre del médico de turno"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-error hover:bg-on-error-container text-on-error font-semibold py-3 px-4 text-xs uppercase tracking-wider flex items-center justify-between transition-colors shadow-xs rounded-none cursor-pointer"
                >
                  <span>{loading ? 'Ingresando...' : 'Acceso Urgente Sin Conexión'}</span>
                  <span className="material-symbols-outlined text-base">bolt</span>
                </button>
              </form>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-surface-container-high flex items-center justify-between text-[11px] text-secondary">
            <span>{branding.footerLeftText}</span>
            <span className="font-mono">{branding.footerRightText}</span>
          </div>
        </div>

        {/* Right Column: Paso 02 // Entorno Operativo */}
        <div className="col-span-12 lg:col-span-7 bg-surface-container-low p-8 lg:p-12 flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-secondary font-semibold font-mono">
                  Paso 02 // Entorno Operativo
                </div>
                <h2 className="text-xl font-semibold text-on-surface">Campaña Activa &amp; Asignación de Box</h2>
              </div>
              <div className="flex items-center gap-2 bg-surface px-3 py-1.5 text-xs font-mono text-on-surface border border-surface-container-high shadow-xs">
                <span className="material-symbols-outlined text-sm text-primary">pin_drop</span>
                <span>Nodo: {selectedCampaign?.node_id || 'Valle Sagrado Sector 04'}</span>
                {selectedCampaign?.distanceFormatted && (
                  <span className="text-[11px] font-semibold text-primary ml-1 bg-primary/10 px-1.5 py-0.5 rounded-xs">
                    ~{selectedCampaign.distanceFormatted}
                  </span>
                )}
              </div>
            </div>

            {/* Panel de Telemetría GPS del Smartphone */}
            <div className="bg-surface p-3.5 border border-surface-container-high shadow-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    {geoStatus === 'locating' ? (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    ) : geoStatus === 'ready' ? (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    ) : null}
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        geoStatus === 'ready'
                          ? 'bg-emerald-500'
                          : geoStatus === 'locating'
                          ? 'bg-primary'
                          : geoStatus === 'simulated'
                          ? 'bg-amber-500'
                          : 'bg-zinc-400'
                      }`}
                    />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-on-surface">
                    Geolocalización del Smartphone
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 font-mono uppercase font-semibold rounded-xs border ${
                      geoStatus === 'ready'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : geoStatus === 'locating'
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : geoStatus === 'simulated'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-surface-container text-secondary border-surface-container-high'
                    }`}
                  >
                    {geoStatus === 'ready'
                      ? 'GPS Activo'
                      : geoStatus === 'locating'
                      ? 'Calculando...'
                      : geoStatus === 'simulated'
                      ? 'Simulado'
                      : 'Sin Señal GPS'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={requestSmartphoneLocation}
                    title="Actualizar posición satelital del smartphone"
                    className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-[11px] font-mono text-on-surface flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <span className={`material-symbols-outlined text-[14px] ${geoStatus === 'locating' ? 'animate-spin' : ''}`}>
                      my_location
                    </span>
                    <span>Actualizar GPS</span>
                  </button>
                </div>
              </div>

              {/* Detalle de posición y cercanía calculada */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11.5px] text-secondary font-mono bg-surface-container-low px-2.5 py-1.5 border border-surface-container-high">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[15px] text-primary">satellite_alt</span>
                  <span className="truncate">{geoMessage || 'Sintonizando posición satelital del smartphone...'}</span>
                </div>
                {nearestCampaign && (
                  <div className="text-primary font-semibold flex items-center gap-1 shrink-0">
                    <span className="text-secondary font-normal">Más cercana:</span>
                    <span className="underline decoration-dotted">{nearestCampaign.name}</span>
                    {nearestCampaign.distanceFormatted && (
                      <span className="bg-primary/10 text-primary px-1 py-0.2 rounded-2xs">
                        ({nearestCampaign.distanceFormatted})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Botones de simulación para pruebas de campo / brigada */}
              <div className="pt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-on-surface-variant font-medium">Probar cercanía:</span>
                {presetLocations.map((p) => {
                  const isAct = coords?.source === 'simulated' && coords.label === p.name
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setSimulatedLocation(p)}
                      title={p.desc}
                      className={`px-2 py-0.5 border text-[11px] font-mono cursor-pointer transition-all ${
                        isAct
                          ? 'bg-primary text-white border-primary shadow-xs font-semibold'
                          : 'bg-surface hover:bg-surface-container border-surface-container-high text-on-surface'
                      }`}
                    >
                      📍 {p.name.split(',')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campaign Selection Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Seleccionar Brigada / Campaña
                </label>
                {nearestCampaign && selectedCampaignId !== nearestCampaign.id && (
                  <button
                    type="button"
                    onClick={resetToNearest}
                    className="text-[11px] text-primary hover:underline font-mono font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">near_me</span>
                    Auto-asignar más cercana ({nearestCampaign.name})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {campaigns.map((camp) => {
                  const isSelected = selectedCampaignId === camp.id
                  const isClosest = camp.isNearest && camp.distanceKm !== undefined
                  const isClosed = camp.status === 'closed'

                  return (
                    <div
                      key={camp.id}
                      onClick={() => !isClosed && selectCampaign(camp.id)}
                      className={`p-4 transition-all relative border ${
                        isClosed
                          ? 'bg-surface border-surface-container-high opacity-40 cursor-not-allowed select-none'
                          : isSelected
                          ? 'bg-surface border-primary shadow-sm ring-1 ring-primary cursor-pointer'
                          : isClosest
                          ? 'bg-surface border-emerald-500/70 hover:border-emerald-600 shadow-2xs cursor-pointer'
                          : 'bg-surface border-surface-container-high hover:border-surface-container-highest cursor-pointer'
                      }`}
                    >
                      {/* Distintivo de campaña más cercana por geolocalización */}
                      {isClosest && (
                        <div className="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-bold bg-emerald-600 text-white uppercase tracking-wider shadow-2xs">
                          <span className="material-symbols-outlined text-[14px] animate-pulse">radar</span>
                          <span>Campaña más cercana calculada por GPS</span>
                          {camp.distanceFormatted && (
                            <span className="font-mono bg-emerald-700 px-1.5 py-0.2 rounded-2xs">
                              a {camp.distanceFormatted}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                camp.status === 'active'
                                  ? 'bg-tertiary text-on-tertiary'
                                  : camp.status === 'planned'
                                  ? 'bg-surface-container-highest text-on-surface'
                                  : 'bg-surface-container-highest text-secondary'
                              }`}
                            >
                              {camp.status === 'active'
                                ? 'En Curso'
                                : camp.status === 'planned'
                                ? 'Programada'
                                : 'Cerrada'}
                            </span>
                            <span className="text-xs font-mono text-secondary">ID: {camp.code}</span>
                            {camp.distanceFormatted && !isClosest && (
                              <span className="text-[11px] font-mono text-secondary bg-surface-container px-2 py-0.5 border border-surface-container-high flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-primary">directions_car</span>
                                <span>a {camp.distanceFormatted}</span>
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-semibold text-on-surface">{camp.name}</h3>
                          <p className="text-xs text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                            {camp.location_name}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {camp.status === 'active' ? (
                            <>
                              <span className="text-2xl font-light font-mono text-primary">{camp.today_count}</span>
                              <div className="text-[11px] text-secondary">Pacientes hoy</div>
                            </>
                          ) : camp.status === 'planned' ? (
                            <span className="text-xs font-mono text-secondary">
                              Inicio: {camp.start_date || '12 Mayo'}
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-secondary">Archivado</span>
                          )}
                        </div>
                      </div>

                      {/* Pie de tarjeta con estado de triajes y selección */}
                      <div className="mt-3 pt-3 flex items-center justify-between text-xs bg-surface-container px-3 py-2 border-t border-surface-container-high">
                        <span className="text-secondary font-mono">
                          {camp.status === 'active'
                            ? 'Triajes activos: 3 | Farmacia: Abierta'
                            : camp.status === 'planned'
                            ? 'En preparación logística de carpa'
                            : 'Hospital de Apoyo • Campaña Finalizada'}
                        </span>
                        {isSelected && !isClosed && (
                          <span className="text-primary font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check_circle</span> Seleccionada
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Station / Box assignment */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Puesto de Trabajo Asignado (Box de Terreno)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'ADM-01', name: 'Admisión 01', desc: 'Filiación DNI', icon: 'badge' },
                  { id: 'TRJ-01', name: 'Triaje Box 1', desc: 'Somatometría', icon: 'vital_signs' },
                  { id: 'MED-01', name: 'Consultorio 1', desc: 'Med. General', icon: 'stethoscope' },
                  { id: 'FAR-01', name: 'Farmacia', desc: 'Botiquín', icon: 'medication' },
                ].map((st) => (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStation(st.id)}
                    className={`p-3 text-left border cursor-pointer transition-all ${
                      selectedStation === st.id
                        ? 'bg-surface border-primary shadow-xs ring-1 ring-primary'
                        : 'bg-surface border-surface-container-high hover:border-surface-container-highest'
                    }`}
                  >
                    <span className="material-symbols-outlined text-primary text-base">{st.icon}</span>
                    <div className="text-xs font-bold text-on-surface mt-1">{st.name}</div>
                    <div className="text-[10px] text-secondary">{st.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-container-high flex items-center justify-between text-xs text-secondary font-mono">
            <span>{branding.footerCenterText}</span>
            <span className="text-tertiary font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Red Mesh Estable
            </span>
          </div>
        </div>
      </div>

      {/* Pie de página institucional y créditos del desarrollador */}
      <AppFooter className="mt-auto" />
    </div>
  )
}
