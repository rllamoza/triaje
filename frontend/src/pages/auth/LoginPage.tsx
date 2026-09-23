import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useLogin, useLoginPin } from '../../api/hooks'
import { useAuthStore } from '../../store/authStore'
import { useBrandingStore } from '../../store/brandingStore'
import { HardwareStatusBar } from '../../components/common/HardwareStatusBar'

type LoginMode = 'credential' | 'pin'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isAuth = useAuthStore((s) => s.isAuthenticated())
  const branding = useBrandingStore()

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

  // Campaigns & Stations
  const [selectedCampaignId, setSelectedCampaignId] = useState<number>(1)
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
      <HardwareStatusBar variant="full" />

      {/* Main Split Grid */}
      <div className="w-full grid grid-cols-12 min-h-[calc(100vh-42px)] flex-1">
        {/* Left Column: Login Form */}
        <div className="col-span-12 lg:col-span-5 bg-surface p-8 lg:p-12 flex flex-col justify-between border-r border-surface-container-high">
          <div className="space-y-6">
            {/* Brand Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex-shrink-0 bg-inverse-surface flex items-center justify-center p-1.5 shadow-sm">
                {branding.isotipoUrl ? (
                  <img
                    alt={branding.appName}
                    className="w-full h-full object-contain"
                    src={branding.isotipoUrl}
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
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-secondary font-semibold font-mono">
                  Paso 02 // Entorno Operativo
                </div>
                <h2 className="text-xl font-semibold text-on-surface">Campaña Activa &amp; Asignación de Box</h2>
              </div>
              <div className="flex items-center gap-2 bg-surface px-3 py-1.5 text-xs font-mono text-on-surface border border-surface-container-high shadow-xs">
                <span className="material-symbols-outlined text-sm text-primary">pin_drop</span>
                <span>Nodo: Valle Sagrado Sector 04</span>
              </div>
            </div>

            {/* Campaign Selection Cards */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Seleccionar Brigada / Campaña
              </label>

              <div className="grid grid-cols-1 gap-3">
                {/* Active Campaign 1 */}
                <div
                  onClick={() => setSelectedCampaignId(1)}
                  className={`cursor-pointer p-4 transition-all relative border ${
                    selectedCampaignId === 1
                      ? 'bg-surface border-primary shadow-sm ring-1 ring-primary'
                      : 'bg-surface border-surface-container-high hover:border-surface-container-highest'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-tertiary text-on-tertiary uppercase tracking-wider">
                          En Curso
                        </span>
                        <span className="text-xs font-mono text-secondary">ID: CMP-2025-CUS-02</span>
                      </div>
                      <h3 className="text-base font-semibold text-on-surface">Cusco - Valle Sagrado 2025</h3>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                        Salón Comunal Rumichaca • Urubamba, Cusco (2,870 msnm)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-light font-mono text-primary">142</span>
                      <div className="text-[11px] text-secondary">Pacientes hoy</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 flex items-center justify-between text-xs bg-surface-container px-3 py-2 border-t border-surface-container-high">
                    <span className="text-secondary font-mono">Triajes activos: 3 | Farmacia: Abierta</span>
                    {selectedCampaignId === 1 && (
                      <span className="text-primary font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span> Seleccionada
                      </span>
                    )}
                  </div>
                </div>

                {/* Scheduled Campaign 2 */}
                <div
                  onClick={() => setSelectedCampaignId(2)}
                  className={`cursor-pointer p-4 transition-all border ${
                    selectedCampaignId === 2
                      ? 'bg-surface border-primary shadow-sm ring-1 ring-primary'
                      : 'bg-surface border-surface-container-high opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-surface-container-highest text-on-surface uppercase tracking-wider">
                          Programada
                        </span>
                        <span className="text-xs font-mono text-secondary">ID: CMP-2025-PUN-01</span>
                      </div>
                      <h3 className="text-base font-medium text-on-surface">Puno - Altiplano 2025</h3>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                        Centro Cívico Ilave • El Collao, Puno (3,850 msnm)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-secondary">Inicio: 12 Mayo</span>
                    </div>
                  </div>
                </div>

                {/* Closed Campaign 3 */}
                <div className="bg-surface p-4 border border-surface-container-high opacity-40 select-none">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-surface-container-highest text-secondary uppercase tracking-wider">
                          Cerrada
                        </span>
                        <span className="text-xs font-mono text-secondary">ID: CMP-2024-HVC-09</span>
                      </div>
                      <h3 className="text-base font-medium text-on-surface">Huancavelica - Pampas</h3>
                      <p className="text-xs text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                        Hospital de Apoyo Tayacaja • Campaña Finalizada
                      </p>
                    </div>
                    <span className="text-xs font-mono text-secondary">Archivado</span>
                  </div>
                </div>
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
    </div>
  )
}
