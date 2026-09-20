import { useState } from 'react'
import {
  useStoreBeneficiario,
  useReniecLookup,
  useStoreAtencion,
} from '../../api/hooks'
import { PATIENT_DATABASE } from '../../services/patientRegistry'

export default function BeneficiarioPage() {
  const [dni, setDni] = useState('45892104')
  const [nombres, setNombres] = useState('SANTOS FAUSTINO')
  const [apellidos, setApellidos] = useState('QUISPE HUAMÁN')
  const [fechaNac, setFechaNac] = useState('1968-08-14')
  const [sexo, setSexo] = useState<'M' | 'F'>('M')
  const [estadoCivil, setEstadoCivil] = useState('conviviente')
  const [idioma, setIdioma] = useState('quechua')
  const [comunidad, setComunidad] = useState('rumichaca')
  const [telefono, setTelefono] = useState('984 312 809')
  const [altitud, setAltitud] = useState(3450)
  const [tiempoViaje, setTiempoViaje] = useState('120')
  const [seguro, setSeguro] = useState<'sis' | 'essalud' | 'ninguno' | 'privado'>('sis')
  const [motivo, setMotivo] = useState('Control general, dolor articular lumbar y cefalea persistente')

  // Antecedentes
  const [hipertension, setHipertension] = useState(true)
  const [diabetes, setDiabetes] = useState(false)
  const [asma, setAsma] = useState(false)
  const [anemia, setAnemia] = useState(false)
  const [gestante, setGestante] = useState(false)
  const [alergias, setAlergias] = useState('Alérgico a Penicilina (choque anafiláctico hace 8 años)')

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isSearchingReniec, setIsSearchingReniec] = useState(false)

  const reniecLookup = useReniecLookup()
  const createBeneficiario = useStoreBeneficiario()
  const createAtencion = useStoreAtencion()

  const handleReniec = async (customDni?: string) => {
    const targetDni = (customDni || dni).trim()
    if (targetDni.length !== 8 || !/^\d{8}$/.test(targetDni)) {
      setMessage({ text: 'Por favor ingrese un número de DNI válido de 8 dígitos.', type: 'error' })
      return
    }
    setIsSearchingReniec(true)
    setMessage(null)
    try {
      const res = await reniecLookup.mutateAsync(targetDni)
      const p = res.data || res

      const nom = p.nombres || ''
      const ape = p.apellidos || `${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.trim()
      const dob = p.fecha_nacimiento || ''
      const sex = (p.sexo === 'F' ? 'F' : 'M') as 'M' | 'F'

      setNombres(nom)
      setApellidos(ape)
      if (dob) setFechaNac(dob)
      setSexo(sex)
      if (p.comunidad) setComunidad(p.comunidad)
      if (p.telefono) setTelefono(p.telefono)

      const src = res.source || (res.from_cache ? 'Padrón Local Campaña' : 'RENIEC Oficial')
      setMessage({
        text: `✓ Identidad verificada para DNI ${targetDni}: ${nom} ${ape} (${src})`,
        type: 'success',
      })
    } catch {
      // Local fallback si el backend no responde o no tiene conexión
      const localMatch = PATIENT_DATABASE.find((pt) => pt.dni === targetDni)
      if (localMatch) {
        const parts = localMatch.paciente.split(',')
        const ape = parts[0]?.trim() || localMatch.paciente
        const nom = parts[1]?.trim() || ''
        setNombres(nom)
        setApellidos(ape)
        setSexo(localMatch.sexo)
        if (localMatch.telefono) setTelefono(localMatch.telefono)
        setMessage({
          text: `✓ Datos cargados desde Padrón Comunitario Local (${localMatch.paciente})`,
          type: 'success',
        })
      } else {
        setMessage({
          text: 'RENIEC no disponible en este momento. Puede ingresar los datos del paciente manualmente.',
          type: 'error',
        })
      }
    } finally {
      setIsSearchingReniec(false)
    }
  }

  const calculateAge = (dob: string) => {
    if (!dob) return 0
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  const handleSubmit = async (printTicket = false) => {
    setMessage(null)
    try {
      const b = await createBeneficiario.mutateAsync({
        dni,
        nombres,
        apellidos,
        fecha_nacimiento: fechaNac,
        sexo,
        comunidad,
        telefono,
        tipo_seguro: seguro,
        alergias: alergias || undefined,
        antecedentes: [
          hipertension ? 'Hipertensión' : '',
          diabetes ? 'Diabetes' : '',
          asma ? 'Asma/EPOC' : '',
          anemia ? 'Anemia' : '',
          gestante ? 'Gestante' : '',
        ].filter(Boolean).join(', ') || undefined,
      })

      // Create initial attendance record
      const atencion = await createAtencion.mutateAsync({
        beneficiario_id: b.id,
        campaign_id: 1,
        seguro_usado: seguro,
      })

      setMessage({
        text: `¡Paciente registrado exitosamente! Ticket asignado: ${atencion.ticket_codigo}${printTicket ? ' (Enviado a impresora térmica BT-POS-01)' : ''}`,
        type: 'success',
      })
    } catch {
      setMessage({ text: 'Error al registrar beneficiario. Verifique los datos.', type: 'error' })
    }
  }

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Header Contextual Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-primary-container text-on-primary-fixed">
              ADM-01
            </span>
            <span className="px-2 py-0.5 text-[11px] font-medium bg-surface-container text-on-surface-variant flex items-center gap-1.5 border border-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              Campaña Activa: Cusco - Valle Sagrado 2025
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-on-surface">
            Registro de Beneficiario{' '}
            <span className="font-semibold text-primary">&amp; Afiliación de Campaña</span>
          </h1>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-surface px-4 py-2 shadow-xs border border-surface-container-high">
            <div className="mr-3 p-2 bg-primary-container text-on-primary-fixed">
              <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant">
                Registrados Hoy
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-on-surface">142</span>
                <span className="text-[10px] text-tertiary font-medium">↑ +18 última hora</span>
              </div>
            </div>
          </div>

          <div className="flex items-center bg-surface px-4 py-2 shadow-xs border border-surface-container-high">
            <div className="mr-3 p-2 bg-surface-container text-on-surface">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant">
                Tiempo Prom. Mesa
              </div>
              <div className="text-xl font-bold text-on-surface">
                02:14 <span className="text-[10px] font-normal text-on-surface-variant">min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div className="flex items-start bg-surface p-3 border border-surface-container-high shadow-xs">
          <div className="mr-3 text-tertiary">
            <span className="material-symbols-outlined text-[20px]">usb</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-on-surface">Periférico Biométrico RENIEC Conectado</div>
              <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-tertiary-container text-on-tertiary-container font-mono">
                Online USB-02
              </span>
            </div>
            <div className="text-xs text-on-surface-variant mt-0.5">
              Lector DNIe listo para captura de huella dactilar y validación de afiliación.
            </div>
          </div>
        </div>

        <div className="flex items-start bg-[#fff8e1] p-3 border border-[#ffe082] shadow-xs">
          <div className="mr-3 text-[#b78103]">
            <span className="material-symbols-outlined text-[20px]">notification_important</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#5c4100]">Control de Historial Comunal</div>
              <span className="text-[10px] font-mono text-[#5c4100] font-bold">EXP-2024-CUS</span>
            </div>
            <div className="text-xs text-[#5c4100] mt-0.5">
              Al ingresar el DNI el sistema verifica si el paciente ya fue atendido en jornadas anteriores.
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 mb-6 text-xs flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-tertiary-container text-on-tertiary-container border-tertiary/30'
              : 'bg-error-container text-on-error-container border-error/30'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Primary Workspace Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Forms */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* SECTION 1: Identificación y Datos Personales */}
          <section className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-on-primary text-xs font-semibold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-sm font-semibold tracking-tight text-on-surface uppercase">
                  Identificación y Datos Personales
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant font-mono">* Campos obligatorios</span>
            </div>

            <div className="space-y-4">
              {/* DNI with RENIEC API Lookup */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-7">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Documento Nacional de Identidad (DNI) *
                  </label>
                  <div className="relative flex border border-surface-container-high bg-surface-container-low focus-within:border-primary focus-within:bg-surface">
                    <input
                      className="w-full h-10 px-3 bg-transparent text-on-surface text-sm font-mono focus:outline-none"
                      maxLength={8}
                      placeholder="Ingrese 8 dígitos de DNI..."
                      type="text"
                      value={dni}
                      onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleReniec()
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={isSearchingReniec}
                      onClick={() => handleReniec()}
                      className="h-10 px-4 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer rounded-none disabled:opacity-50"
                      title="Buscar datos del paciente por DNI (Enter o clic)"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${isSearchingReniec ? 'animate-spin' : ''}`}>
                        {isSearchingReniec ? 'sync' : 'fingerprint'}
                      </span>
                      <span>{isSearchingReniec ? 'Buscando...' : 'Buscar RENIEC'}</span>
                    </button>
                  </div>
                  {/* Píldoras de DNI para prueba rápida */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-mono text-on-surface-variant">Rápidos:</span>
                    {[
                      { num: '45892104', label: 'Santos Q.' },
                      { num: '02817462', label: 'Rosa M.' },
                      { num: '42918274', label: 'Juan Q.' },
                      { num: '78291043', label: 'Dylan H.' },
                      { num: '48920194', label: 'Hilda R.' },
                    ].map((item) => (
                      <button
                        key={item.num}
                        type="button"
                        onClick={() => {
                          setDni(item.num)
                          handleReniec(item.num)
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-on-surface transition-colors cursor-pointer"
                        title={`Cargar datos para DNI ${item.num}`}
                      >
                        {item.num} ({item.label})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-5 flex items-center gap-2 pb-2 text-xs text-tertiary font-medium">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Conectado a RENIEC &amp; Padrón Local Activo</span>
                </div>
              </div>

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Apellidos Completos *
                  </label>
                  <input
                    className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm border border-surface-container-high focus:border-primary focus:bg-surface focus:outline-none uppercase"
                    type="text"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Nombres *
                  </label>
                  <input
                    className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-sm border border-surface-container-high focus:border-primary focus:bg-surface focus:outline-none uppercase"
                    type="text"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                  />
                </div>
              </div>

              {/* Fecha de Nacimiento, Edad, Sexo, Estado Civil, Idioma */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    F. Nacimiento *
                  </label>
                  <input
                    className="w-full h-10 px-2 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none"
                    type="date"
                    value={fechaNac}
                    onChange={(e) => setFechaNac(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Edad Calc.
                  </label>
                  <div className="h-10 px-3 bg-surface-container flex items-center justify-between text-sm font-semibold text-on-surface border border-surface-container-high">
                    <span>{calculateAge(fechaNac)}</span>
                    <span className="text-[11px] font-normal text-on-surface-variant">años</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Sexo Biológico *
                  </label>
                  <select
                    className="w-full h-10 px-2 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value as 'M' | 'F')}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Estado Civil
                  </label>
                  <select
                    className="w-full h-10 px-2 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                    value={estadoCivil}
                    onChange={(e) => setEstadoCivil(e.target.value)}
                  >
                    <option value="conviviente">Conviviente</option>
                    <option value="casado">Casado(a)</option>
                    <option value="soltero">Soltero(a)</option>
                    <option value="viudo">Viudo(a)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Lengua Materna *
                  </label>
                  <select
                    className="w-full h-10 px-2 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                    value={idioma}
                    onChange={(e) => setIdioma(e.target.value)}
                  >
                    <option value="quechua">Quechua Collao</option>
                    <option value="castellano">Castellano</option>
                    <option value="aimara">Aimara</option>
                    <option value="bilingue">Bilingüe</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Residencia y Contacto */}
          <section className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-on-primary text-xs font-semibold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-sm font-semibold tracking-tight text-on-surface uppercase">
                  Datos de Residencia y Contacto Comunitario
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant">Acceso geográfico y cobertura</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Comunidad / Sector Rural *
                </label>
                <select
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                  value={comunidad}
                  onChange={(e) => setComunidad(e.target.value)}
                >
                  <option value="rumichaca">Rumichaca (Sector Alto)</option>
                  <option value="ollantaytambo">Ollantaytambo (Comunidad Willoq)</option>
                  <option value="marcas">Marcas - Huayllabamba</option>
                  <option value="urubamba">Urubamba Centro</option>
                  <option value="yanahuara">Yanahuara</option>
                </select>
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Móvil / WhatsApp de Contacto
                </label>
                <div className="flex border border-surface-container-high bg-surface-container-low focus-within:border-primary">
                  <span className="h-10 px-3 bg-surface-container text-xs text-on-surface-variant flex items-center font-mono">
                    +51
                  </span>
                  <input
                    className="w-full h-10 px-3 bg-transparent text-on-surface text-sm focus:outline-none"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Altitud Habitual (msnm)
                </label>
                <div className="relative border border-surface-container-high bg-surface-container-low">
                  <input
                    className="w-full h-10 px-3 bg-transparent text-on-surface text-sm focus:outline-none"
                    type="number"
                    value={altitud}
                    onChange={(e) => setAltitud(Number(e.target.value))}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-on-surface-variant">msnm</span>
                </div>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Tiempo de Traslado a pie
                </label>
                <select
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                  value={tiempoViaje}
                  onChange={(e) => setTiempoViaje(e.target.value)}
                >
                  <option value="30">Menos de 30 min</option>
                  <option value="60">30 min a 1 hora</option>
                  <option value="120">1 a 2 horas a pie</option>
                  <option value="180">Más de 2 horas a pie</option>
                </select>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Afiliación a Seguro Médico *
                </label>
                <select
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none cursor-pointer"
                  value={seguro}
                  onChange={(e) => setSeguro(e.target.value as 'sis' | 'essalud' | 'ninguno' | 'privado')}
                >
                  <option value="sis">SIS Gratuito Subsidiado</option>
                  <option value="essalud">EsSalud (Seguro Social)</option>
                  <option value="ninguno">Sin Seguro / No Afiliado</option>
                  <option value="privado">Seguro Privado / FFAA</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECTION 3: Antecedentes & Factores de Riesgo */}
          <section className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-on-primary text-xs font-semibold flex items-center justify-center">
                  3
                </span>
                <h2 className="text-sm font-semibold tracking-tight text-on-surface uppercase">
                  Antecedentes &amp; Factores de Riesgo Crónico
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">Marcaje rápido de tamizaje</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={hipertension}
                  onChange={(e) => setHipertension(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary rounded-none"
                />
                <div>
                  <div className="text-xs font-semibold text-on-surface">Hipertensión Arterial</div>
                  <div className="text-[11px] text-on-surface-variant mt-0.5">Control de presión en Triaje</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={diabetes}
                  onChange={(e) => setDiabetes(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary rounded-none"
                />
                <div>
                  <div className="text-xs font-semibold text-on-surface">Diabetes Mellitus</div>
                  <div className="text-[11px] text-on-surface-variant mt-0.5">Glucemia capilar recomendada</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={asma}
                  onChange={(e) => setAsma(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary rounded-none"
                />
                <div>
                  <div className="text-xs font-semibold text-on-surface">Asma / EPOC / Silicosis</div>
                  <div className="text-[11px] text-on-surface-variant mt-0.5">Exposición a humo / minas</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={anemia}
                  onChange={(e) => setAnemia(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary rounded-none"
                />
                <div>
                  <div className="text-xs font-semibold text-on-surface">Desnutrición / Anemia</div>
                  <div className="text-[11px] text-on-surface-variant mt-0.5">Dosaje de Hemoglobina rápida</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={gestante}
                  onChange={(e) => setGestante(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary rounded-none"
                />
                <div>
                  <div className="text-xs font-semibold text-on-surface">Embarazo / Gestante</div>
                  <div className="text-[11px] text-on-surface-variant mt-0.5">Prioridad Obstétrica</div>
                </div>
              </label>

              <label className="flex items-start gap-3 bg-error-container p-3 border border-error/30 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 h-4 w-4 accent-error rounded-none"
                />
                <div>
                  <div className="text-xs font-bold text-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">warning</span>
                    Alergias Medicamentosas
                  </div>
                  <div className="text-[11px] text-on-error-container font-medium mt-0.5">
                    Penicilina / Betalactámicos
                  </div>
                </div>
              </label>
            </div>

            <div className="mt-4 pt-3 border-t border-surface-container-high">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Detalle de Alergias o Reacciones Adversas conocidas:
              </label>
              <input
                className="w-full h-9 px-3 bg-surface-container-low text-xs text-error font-medium border border-error/50 focus:outline-none"
                type="text"
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
              />
            </div>
          </section>

          {/* Motivo de consulta */}
          <section className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Motivo de Consulta o Molestia Principal
            </label>
            <textarea
              rows={2}
              className="w-full p-3 bg-surface-container-low text-xs text-on-surface border border-surface-container-high focus:border-primary focus:bg-surface focus:outline-none"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </section>
        </div>

        {/* Right Column: Ticket Dispatcher & Recent List */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Card: Generación de Ticket */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="text-xs uppercase tracking-widest text-primary font-bold font-mono mb-1">
              Asignación Inmediata
            </div>
            <h3 className="text-base font-semibold text-on-surface mb-4">
              Ticket de Atención en Campo
            </h3>

            <div className="bg-surface-container p-4 border border-surface-container-high text-center mb-5">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-secondary">
                Próximo Turno Disponible
              </div>
              <div className="text-3xl font-mono font-bold text-primary my-1">
                # T - 1 4 3
              </div>
              <div className="text-xs text-on-surface font-medium">
                Derivación Directa a: <strong className="text-primary">Triaje Box 1</strong>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="w-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-semibold py-3 px-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs rounded-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Guardar e Imprimir Ticket
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(false)}
                className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold py-2.5 px-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-surface-container-high rounded-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">check</span>
                Solo Registrar Paciente
              </button>
            </div>
          </div>

          {/* Card: Pacientes Registrados Recientemente */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider">
                Registrados Recientes
              </h3>
              <span className="text-[11px] font-mono text-tertiary font-bold">En cola</span>
            </div>

            <div className="space-y-2 divide-y divide-surface-container-high">
              {[
                { id: 1, nombres: 'Juan', apellidos: 'Quispe Condori', dni: '42918274', comunidad: 'Rumichaca' },
                { id: 2, nombres: 'Rosa', apellidos: 'Mamani Quispe', dni: '02817462', comunidad: 'Willoq' },
                { id: 3, nombres: 'Dina', apellidos: 'Ccori Huallpa', dni: '71928301', comunidad: 'Marcas' },
              ].map((p: { id: number; nombres: string; apellidos: string; dni: string; comunidad?: string }) => (
                <div key={p.id} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-on-surface">
                      {p.apellidos}, {p.nombres}
                    </div>
                    <div className="text-[11px] text-secondary font-mono">
                      DNI: {p.dni} • {p.comunidad ?? 'Rumichaca'}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-tertiary-container text-on-tertiary-container">
                    Triaje
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
