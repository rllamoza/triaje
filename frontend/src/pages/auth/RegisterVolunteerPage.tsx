import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  useRegisterVolunteer,
  useVerifyEmailCode,
  useResendEmailCode,
} from '../../api/hooks'
import { useAuthStore } from '../../store/authStore'
import { useBrandingStore } from '../../store/brandingStore'

type VolunteerRole =
  | 'medico'
  | 'triaje'
  | 'admision'
  | 'farmacia'
  | 'guardia'
  | 'coordinador'
  | 'voluntario'

interface RoleOption {
  id: VolunteerRole
  title: string
  subtitle: string
  icon: string
  badge: string
  color: string
}

const ROLES: RoleOption[] = [
  {
    id: 'medico',
    title: 'Médico',
    subtitle: 'Atención clínica y prescripción',
    icon: '🩺',
    badge: 'CMP requerido',
    color: 'from-teal-600 to-emerald-700',
  },
  {
    id: 'triaje',
    title: 'Enfermería / Triaje',
    subtitle: 'Signos vitales y clasificación',
    icon: '🩹',
    badge: 'Área Asistencial',
    color: 'from-blue-600 to-teal-700',
  },
  {
    id: 'admision',
    title: 'Admisión y Registro',
    subtitle: 'Padrón RENIEC y entrega de tickets',
    icon: '📋',
    badge: 'Mesa de Entrada',
    color: 'from-cyan-600 to-blue-700',
  },
  {
    id: 'farmacia',
    title: 'Farmacia',
    subtitle: 'Dispensación y control de stock',
    icon: '💊',
    badge: 'Dispensario',
    color: 'from-indigo-600 to-teal-700',
  },
  {
    id: 'coordinador',
    title: 'Coordinador',
    subtitle: 'Gestión logística y de brigadas',
    icon: '🌟',
    badge: 'Supervisión',
    color: 'from-amber-600 to-orange-700',
  },
  {
    id: 'guardia',
    title: 'Logística / Guardia',
    subtitle: 'Seguridad y control de colas',
    icon: '🛡️',
    badge: 'Operaciones',
    color: 'from-slate-700 to-zinc-800',
  },
  {
    id: 'voluntario',
    title: 'Voluntario General',
    subtitle: 'Acompañamiento y orientación',
    icon: '🤝',
    badge: 'Comunitario',
    color: 'from-emerald-600 to-teal-800',
  },
]

export default function RegisterVolunteerPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const branding = useBrandingStore()

  // Pasos: 'form' | 'verify'
  const [step, setStep] = useState<'form' | 'verify'>('form')

  // Datos del formulario
  const [name, setName] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<VolunteerRole>('medico')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cmpCode, setCmpCode] = useState('')
  const [especialidad, setEspecialidad] = useState('')

  // Estado de verificación (OTP 6 dígitos)
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [resendCooldown, setResendCooldown] = useState(60)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null)

  // Mutaciones
  const registerMutation = useRegisterVolunteer()
  const verifyMutation = useVerifyEmailCode()
  const resendMutation = useResendEmailCode()

  // Temporizador para reenvío
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (step === 'verify' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [step, resendCooldown])

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setStatusMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (role === 'medico' && !cmpCode.trim()) {
      setErrorMessage('Por favor ingrese su número de colegiatura médica (CMP).')
      return
    }

    try {
      const res = await registerMutation.mutateAsync({
        name,
        apellidos,
        email,
        password,
        role,
        dni: dni.trim() || undefined,
        telefono: telefono.trim() || undefined,
        cmp_code: cmpCode.trim() || undefined,
        especialidad: especialidad.trim() || undefined,
      })

      // Si Brevo estaba en modo simulado (sin API key en .env), capturar aviso
      if (res.brevo_status?.simulated && res.brevo_status?.message) {
        setSimulatedCode(res.brevo_status.message)
      }

      setStatusMessage(res.message || 'Código enviado a tu correo.')
      setStep('verify')
      setResendCooldown(60)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErrorMessage(msg ?? 'Ocurrió un error al registrarse. Revise sus datos.')
    }
  }

  // Manejo de casillas de 6 dígitos
  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '')
    const newOtp = [...otp]

    if (clean.length > 1) {
      // Si el usuario pegó el código completo
      const digits = clean.slice(0, 6).split('')
      digits.forEach((d, i) => {
        newOtp[i] = d
      })
      setOtp(newOtp)
      const nextIdx = Math.min(5, digits.length)
      document.getElementById(`otp-box-${nextIdx}`)?.focus()
      return
    }

    newOtp[index] = clean
    setOtp(newOtp)

    if (clean && index < 5) {
      document.getElementById(`otp-box-${index + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-box-${index - 1}`)?.focus()
    }
  }

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setStatusMessage('')

    const code = otp.join('')
    if (code.length < 6) {
      setErrorMessage('Por favor ingrese el código completo de 6 dígitos.')
      return
    }

    try {
      const res = await verifyMutation.mutateAsync({
        email,
        code,
      })

      // Iniciar sesión inmediatamente con los datos recibidos
      setAuth({
        token: res.token,
        expires_at: res.expires_at,
        user: res.user,
        campaign_id: 1,
        station_id: res.station_id || 'ADM-01',
      })

      // Redirección inteligente según el rol
      const roleTarget: Record<string, string> = {
        medico: '/consulta',
        triaje: '/triaje',
        admision: '/admision',
        farmacia: '/queue',
        guardia: '/queue',
        coordinador: '/queue',
        voluntario: '/queue',
      }

      navigate(roleTarget[res.user?.role] || '/queue', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErrorMessage(msg ?? 'Código inválido o expirado. Intente de nuevo.')
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return
    setErrorMessage('')
    setStatusMessage('')

    try {
      const res = await resendMutation.mutateAsync({ email })
      if (res.brevo_status?.simulated && res.brevo_status?.message) {
        setSimulatedCode(res.brevo_status.message)
      }
      setStatusMessage('Nuevo código enviado. Revise su bandeja de entrada.')
      setResendCooldown(60)
      setOtp(['', '', '', '', '', ''])
      document.getElementById('otp-box-0')?.focus()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErrorMessage(msg ?? 'No se pudo reenviar el código. Intente más tarde.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col justify-center items-center p-4">
      {/* Encabezado */}
      <div className="w-full max-w-2xl text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-3xl mb-3 shadow-lg shadow-teal-900/50">
          🩺
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {branding.appName || 'ElRond'}
        </h1>
        <p className="text-teal-300/80 text-sm mt-1">
          {step === 'form'
            ? `${branding.appTagline} • Registro de Voluntarios`
            : 'Confirmación y Verificación de Correo Electrónico'}
        </p>
      </div>

      <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-teal-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
        {/* Alerta de Error */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-sm flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Alerta Informativa / Éxito */}
        {statusMessage && (
          <div className="mb-6 p-4 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-200 text-sm flex items-start gap-3">
            <span className="text-lg">✉️</span>
            <div className="flex-1">{statusMessage}</div>
          </div>
        )}

        {/* Notificación de Simulación (si aún no colocan la API Key) */}
        {simulatedCode && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs">
            <strong>Aviso de Desarrollo:</strong> {simulatedCode}
          </div>
        )}

        {step === 'form' ? (
          /* FORMULARIO DE REGISTRO */
          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-teal-300 uppercase tracking-wider mb-2">
                1. Selecciona tu rol en la campaña
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {ROLES.map((r) => {
                  const isSelected = role === r.id
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-teal-600/30 border-teal-400 ring-2 ring-teal-400/40'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-2xl">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-white">{r.title}</span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-700/80 text-teal-300">
                            {r.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{r.subtitle}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <label className="block text-xs font-semibold text-teal-300 uppercase tracking-wider mb-3">
                2. Datos Personales y Profesionales
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Carlos Alberto"
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Ej. Mendoza Quispe"
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">DNI (Documento)</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="8 dígitos"
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Celular / WhatsApp</label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. 987654321"
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>

                {(role === 'medico' || role === 'triaje') && (
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      {role === 'medico' ? 'Colegiatura CMP *' : 'Colegiatura CEP (Opcional)'}
                    </label>
                    <input
                      type="text"
                      required={role === 'medico'}
                      value={cmpCode}
                      onChange={(e) => setCmpCode(e.target.value)}
                      placeholder={role === 'medico' ? 'CMP-XXXXX' : 'CEP-XXXXX'}
                      className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                    />
                  </div>
                )}

                {role === 'medico' && (
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Especialidad Médica</label>
                    <input
                      type="text"
                      value={especialidad}
                      onChange={(e) => setEspecialidad(e.target.value)}
                      placeholder="Ej. Pediatría, Medicina General"
                      className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <label className="block text-xs font-semibold text-teal-300 uppercase tracking-wider mb-3">
                3. Credenciales de Acceso
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-300 mb-1">
                    Correo Electrónico (Donde recibirás el código de 6 dígitos) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu.correo@ejemplo.com"
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Contraseña (Mínimo 6 caracteres) *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Confirmar Contraseña *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-teal-900/40 transition-all flex items-center justify-center gap-2"
              >
                {registerMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enviando código de verificación...
                  </>
                ) : (
                  <>
                    <span>Continuar y verificar correo</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                ¿Ya tienes una cuenta de voluntario?{' '}
                <Link to="/login" className="text-teal-400 hover:underline font-medium">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </form>
        ) : (
          /* PASO 2: VERIFICACIÓN CON CÓDIGO DE 6 DÍGITOS */
          <form onSubmit={handleVerifySubmit} className="space-y-6 text-center">
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 inline-block w-full">
              <p className="text-xs text-slate-300">
                Hemos enviado un código de 6 dígitos a:
              </p>
              <p className="text-base font-semibold text-teal-300 mt-1">{email}</p>
              <p className="text-xs text-slate-400 mt-1">
                El código es válido durante <strong>15 minutos</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-teal-300 uppercase tracking-wider mb-4">
                Ingresa el código de 6 dígitos
              </label>

              {/* Contenedor OTP de 6 cajitas estilo moderno */}
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-box-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-14 sm:w-14 sm:h-16 text-center text-2xl font-mono font-bold bg-slate-950/80 border-2 border-slate-700 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20 rounded-xl text-teal-300 focus:outline-none transition-all shadow-inner"
                  />
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={verifyMutation.isPending}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-teal-900/40 transition-all flex items-center justify-center gap-2"
              >
                {verifyMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verificando código...
                  </>
                ) : (
                  <>
                    <span>Confirmar y Entrar al Sistema</span>
                    <span>✓</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || resendMutation.isPending}
                className="text-teal-400 hover:underline disabled:text-slate-500 font-medium"
              >
                {resendCooldown > 0
                  ? `Reenviar nuevo código en ${resendCooldown}s`
                  : resendMutation.isPending
                  ? 'Reenviando...'
                  : '¿No recibiste el correo? Reenviar código'}
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Corregir datos / Correo
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
