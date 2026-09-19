import { useState } from 'react'
import { useStoreTriaje } from '../../api/hooks'

export default function SignosVitalesPage() {
  const [priority, setPriority] = useState<1 | 2 | 3>(2)

  // Vitals
  const [paSistolica, setPaSistolica] = useState(145)
  const [paDiastolica, setPaDiastolica] = useState(95)
  const [fc, setFc] = useState(88)
  const [fr, setFr] = useState(20)
  const [temperatura, setTemperatura] = useState(38.6)
  const [spo2, setSpo2] = useState(92)
  const [glucosa, setGlucosa] = useState(110)
  const [peso, setPeso] = useState(68.5)
  const [talla, setTalla] = useState(1.62)
  const [glasgow, setGlasgow] = useState(15)
  const [observaciones, setObservaciones] = useState('Paciente refiere malestar general, dolor lumbar de 3 días y cefalea frontal.')

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [saving, setSaving] = useState(false)

  const createTriaje = useStoreTriaje()

  const imc = talla > 0 ? (peso / (talla * talla)).toFixed(1) : '0'

  // Altitudinal SpO2 status (altitude 2,870 msnm)
  const getSpo2Status = (val: number) => {
    if (val >= 90) return { label: 'Normal en Altura', color: 'text-tertiary bg-tertiary-container' }
    if (val >= 85) return { label: 'Hipoxia Leve (Altura)', color: 'text-[#92400e] bg-[#fef3c7]' }
    return { label: 'Hipoxia Severa (Oxígeno)', color: 'text-on-error bg-error' }
  }

  const handleSave = async (printSlip = false) => {
    setMessage(null)
    setSaving(true)
    try {
      await createTriaje.mutateAsync({
        atencion_id: 1, // Default attention or current loaded ticket
        presion_sistolica: paSistolica,
        presion_diastolica: paDiastolica,
        frecuencia_cardiaca: fc,
        frecuencia_respiratoria: fr,
        temperatura,
        spo2,
        glucosa,
        peso_kg: peso,
        talla_cm: Math.round(talla * 100),
        escala_glasgow: glasgow,
        prioridad: priority === 1 ? 'rojo' : priority === 2 ? 'amarillo' : 'verde',
        observaciones,
      })

      setMessage({
        text: `Triaje completado con Prioridad ${priority === 1 ? 'I (Rojo)' : priority === 2 ? 'II (Amarillo)' : 'III (Verde)'} registrado correctamente.${printSlip ? ' Ticket con constantes enviado a impresión.' : ''}`,
        type: 'success',
      })
    } catch {
      setMessage({
        text: 'Error al registrar triaje. Verifique la conexión con la base de datos local.',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const spo2Status = getSpo2Status(spo2)

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Top Patient Context Banner (Carbon Productive Bar) */}
      <div className="bg-surface shadow-xs border border-surface-container-high mb-6 p-4 md:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-4">
          <div className="w-14 h-14 bg-primary-container text-on-primary-container flex items-center justify-center font-mono font-bold text-xl border border-primary/20">
            T-104
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-on-surface">
                Juan Quispe Condori
              </h1>
              <span className="bg-surface-container-high text-on-surface-variant text-xs px-2 py-0.5 font-mono">
                DNI: 42918274
              </span>
              <span className="bg-surface-container-high text-on-surface-variant text-xs px-2 py-0.5">
                54 años (Adulto)
              </span>
              <span className="bg-surface-container text-on-surface-variant text-xs px-2 py-0.5 flex items-center gap-1 border border-surface-container-high">
                <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                Ollantaytambo, Cusco (2,792 msnm)
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Llegada: 08:42 AM • Seguro: SIS Activo • Campaña Valle Sagrado • Box: Triaje 01
            </p>
          </div>
        </div>

        {/* Alert Badges & Quick Status */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          <div className="bg-error-container text-on-error-container px-3.5 py-2 flex items-center gap-2 border border-error/30">
            <span className="material-symbols-outlined text-error text-[20px]">warning</span>
            <span className="text-xs font-bold uppercase tracking-wider">
              Alergia Severa: Penicilina
            </span>
          </div>
          <div className="bg-surface-container px-3 py-2 flex items-center gap-2 text-on-surface border border-surface-container-high">
            <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
            <span className="text-xs font-mono font-semibold">Espera: 12 min</span>
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

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Form */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Triage Level Selector (Manchester Modificada Andina) */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Clasificación Manchester Modificada (Andina)
                </div>
                <h2 className="text-base font-semibold text-on-surface">
                  Nivel de Prioridad de Triaje Clínico
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant flex items-center gap-1 font-mono">
                <span className="material-symbols-outlined text-[16px] text-tertiary">verified_user</span>
                Protocolo MINSA
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Priority I: Red / Emergent */}
              <div
                onClick={() => setPriority(1)}
                className={`cursor-pointer p-4 transition-all relative flex flex-col justify-between border ${
                  priority === 1
                    ? 'bg-surface border-error shadow-sm ring-2 ring-error'
                    : 'bg-surface-container border-surface-container-high hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold tracking-widest text-error uppercase">Prioridad I</span>
                  <span className="material-symbols-outlined text-error text-[22px]">e911_emergency</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-on-surface">Emergencia (Rojo)</div>
                  <div className="text-xs text-on-surface-variant mt-1 leading-snug">
                    Riesgo vital inmediato o inestabilidad severa. Reanimación 0 min.
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-mono text-error font-bold flex items-center justify-between">
                  <span>ATENCIÓN INMEDIATA</span>
                  {priority === 1 && <span className="material-symbols-outlined text-base">check_circle</span>}
                </div>
              </div>

              {/* Priority II: Yellow / Urgent */}
              <div
                onClick={() => setPriority(2)}
                className={`cursor-pointer p-4 transition-all relative flex flex-col justify-between border ${
                  priority === 2
                    ? 'bg-surface border-[#b28600] shadow-sm ring-2 ring-[#b28600]'
                    : 'bg-surface-container border-surface-container-high hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold tracking-widest text-[#b28600] uppercase">Prioridad II</span>
                  <span className="material-symbols-outlined text-[#b28600] text-[22px]">notification_important</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-on-surface">Urgencia Relativa (Amarillo)</div>
                  <div className="text-xs text-on-surface-variant mt-1 leading-snug">
                    Signos alterados con riesgo potencial. Espera máxima &lt; 15 min.
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-mono text-[#b28600] font-bold flex items-center justify-between">
                  <span>SELECCIONADO</span>
                  {priority === 2 && <span className="material-symbols-outlined text-base">check_circle</span>}
                </div>
              </div>

              {/* Priority III: Green / Non-Urgent */}
              <div
                onClick={() => setPriority(3)}
                className={`cursor-pointer p-4 transition-all relative flex flex-col justify-between border ${
                  priority === 3
                    ? 'bg-surface border-tertiary shadow-sm ring-2 ring-tertiary'
                    : 'bg-surface-container border-surface-container-high hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold tracking-widest text-tertiary uppercase">Prioridad III</span>
                  <span className="material-symbols-outlined text-tertiary text-[22px]">health_and_safety</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-on-surface">No Urgente (Verde)</div>
                  <div className="text-xs text-on-surface-variant mt-1 leading-snug">
                    Paciente hemodinámicamente estable. Espera estándar &lt; 60 min.
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-mono text-tertiary font-bold flex items-center justify-between">
                  <span>CONSULTA GENERAL</span>
                  {priority === 3 && <span className="material-symbols-outlined text-base">check_circle</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Vital Signs Grid */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Toma de Signos Fisiológicos
                </div>
                <h2 className="text-base font-semibold text-on-surface">
                  Signos Vitales y Somatometría
                </h2>
              </div>
              <div className="flex items-center gap-2 bg-surface-container px-2.5 py-1 text-xs font-mono text-on-surface-variant border border-surface-container-high">
                <span>Lectura Bluetooth: Omron HEM-7120</span>
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Presión Arterial */}
              <div className="bg-surface-container p-3.5 flex flex-col justify-between border border-surface-container-high">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Presión Art. (PA)</span>
                  <span className="material-symbols-outlined text-[16px]">blood_pressure</span>
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    value={paSistolica}
                    onChange={(e) => setPaSistolica(Number(e.target.value))}
                    className="w-14 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high focus:outline-none"
                  />
                  <span className="font-bold text-secondary">/</span>
                  <input
                    type="number"
                    value={paDiastolica}
                    onChange={(e) => setPaDiastolica(Number(e.target.value))}
                    className="w-14 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high focus:outline-none"
                  />
                  <span className="text-[11px] text-secondary font-mono">mmHg</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-[#fef3c7] text-[#92400e]">
                  Prehipertensión II
                </span>
              </div>

              {/* Frecuencia Cardíaca */}
              <div className="bg-surface-container p-3.5 flex flex-col justify-between border border-surface-container-high">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Frec. Cardíaca</span>
                  <span className="material-symbols-outlined text-[16px]">cardiology</span>
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    value={fc}
                    onChange={(e) => setFc(Number(e.target.value))}
                    className="w-20 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high focus:outline-none"
                  />
                  <span className="text-[11px] text-secondary font-mono">lpm</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-tertiary-container text-on-tertiary-container">
                  Normocárdico
                </span>
              </div>

              {/* Temperatura */}
              <div className="bg-surface-container p-3.5 flex flex-col justify-between border border-surface-container-high">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Temperatura</span>
                  <span className="material-symbols-outlined text-[16px]">device_thermostat</span>
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={temperatura}
                    onChange={(e) => setTemperatura(Number(e.target.value))}
                    className="w-20 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high focus:outline-none"
                  />
                  <span className="text-[11px] text-secondary font-mono">°C</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-[#fee2e2] text-[#991b1b]">
                  Febril / Alerta
                </span>
              </div>

              {/* SpO2 Altitudinal */}
              <div className="bg-surface-container p-3.5 flex flex-col justify-between border border-surface-container-high">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">SpO2 (Altitud)</span>
                  <span className="material-symbols-outlined text-[16px]">air</span>
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(Number(e.target.value))}
                    className="w-20 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high focus:outline-none"
                  />
                  <span className="text-[11px] text-secondary font-mono">%</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 ${spo2Status.color}`}>
                  {spo2Status.label}
                </span>
              </div>

              {/* Frecuencia Respiratoria */}
              <div className="bg-surface-container p-3.5 flex flex-col justify-between border border-surface-container-high">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Frec. Respiratoria</span>
                  <span className="material-symbols-outlined text-[16px]">lungs</span>
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    value={fr}
                    onChange={(e) => setFr(Number(e.target.value))}
                    className="w-20 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high focus:outline-none"
                  />
                  <span className="text-[11px] text-secondary font-mono">rpm</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-tertiary-container text-on-tertiary-container">
                  Eupneico
                </span>
              </div>

              {/* Glucosa */}
              <div className="bg-surface-container p-3.5 flex flex-col justify-between border border-surface-container-high">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Glucemia Capilar</span>
                  <span className="material-symbols-outlined text-[16px]">water_drop</span>
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    value={glucosa}
                    onChange={(e) => setGlucosa(Number(e.target.value))}
                    className="w-20 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high focus:outline-none"
                  />
                  <span className="text-[11px] text-secondary font-mono">mg/dL</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-tertiary-container text-on-tertiary-container">
                  Normoglucemia
                </span>
              </div>

              {/* Peso & Talla */}
              <div className="bg-surface-container p-3.5 flex flex-col justify-between border border-surface-container-high">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Peso / Talla</span>
                  <span className="material-symbols-outlined text-[16px]">monitor_weight</span>
                </div>
                <div className="my-2 flex items-baseline gap-1 text-xs">
                  <input
                    type="number"
                    step="0.5"
                    value={peso}
                    onChange={(e) => setPeso(Number(e.target.value))}
                    className="w-14 bg-surface font-mono font-bold text-sm px-1 py-0.5 border border-surface-container-high focus:outline-none"
                  />
                  <span className="text-[10px] text-secondary">kg /</span>
                  <input
                    type="number"
                    step="0.01"
                    value={talla}
                    onChange={(e) => setTalla(Number(e.target.value))}
                    className="w-14 bg-surface font-mono font-bold text-sm px-1 py-0.5 border border-surface-container-high focus:outline-none"
                  />
                  <span className="text-[10px] text-secondary">m</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 bg-surface-container-high text-on-surface">
                  IMC: {imc} kg/m²
                </span>
              </div>

              {/* Glasgow */}
              <div className="bg-surface-container p-3.5 flex flex-col justify-between border border-surface-container-high">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Escala Glasgow</span>
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    max={15}
                    min={3}
                    value={glasgow}
                    onChange={(e) => setGlasgow(Number(e.target.value))}
                    className="w-20 bg-surface text-on-surface font-mono font-bold text-lg px-1.5 py-0.5 border border-surface-container-high focus:outline-none"
                  />
                  <span className="text-[11px] text-secondary font-mono">/ 15</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-tertiary-container text-on-tertiary-container">
                  Lúcido / Orientado
                </span>
              </div>
            </div>

            {/* Observaciones de Triaje */}
            <div className="mt-4 pt-4 border-t border-surface-container-high">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Hallazgos Físicos &amp; Observaciones de Triaje
              </label>
              <textarea
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full p-3 bg-surface-container text-xs text-on-surface border border-surface-container-high focus:border-primary focus:bg-surface focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="w-full sm:w-auto bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-semibold py-3 px-6 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer rounded-none"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Confirmar Triaje &amp; Imprimir Ticket</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto bg-surface hover:bg-surface-container text-on-surface font-semibold py-3 px-5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-surface-container-high cursor-pointer rounded-none"
            >
              <span className="material-symbols-outlined text-base">check</span>
              <span>Guardar Sin Impresión</span>
            </button>
          </div>
        </div>

        {/* Right Column: Historical Context & Altitude Guidelines */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Card: Protocolo Altitudinal */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="text-xs uppercase tracking-widest text-primary font-bold font-mono mb-1">
              Guía de Campo MINSA
            </div>
            <h3 className="text-sm font-semibold text-on-surface mb-3">
              Valores Normales SpO2 en Gran Altitud
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2 bg-surface-container border border-surface-container-high">
                <span className="text-on-surface-variant font-medium">Nivel del Mar (0 - 1,000m):</span>
                <span className="font-mono font-bold text-on-surface">95 - 100%</span>
              </div>
              <div className="flex justify-between p-2 bg-surface-container border border-surface-container-high">
                <span className="text-on-surface-variant font-medium">Valle Sagrado (2,800m):</span>
                <span className="font-mono font-bold text-tertiary">90 - 95%</span>
              </div>
              <div className="flex justify-between p-2 bg-surface-container border border-surface-container-high">
                <span className="text-on-surface-variant font-medium">Altiplano Puno (3,800m):</span>
                <span className="font-mono font-bold text-[#b28600]">86 - 92%</span>
              </div>
              <div className="flex justify-between p-2 bg-error-container text-on-error-container border border-error/30">
                <span className="font-semibold">Criterio Oxigenoterapia:</span>
                <span className="font-mono font-bold text-error">&lt; 85%</span>
              </div>
            </div>
          </div>

          {/* Card: Histórico de Consultas del Paciente */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider mb-3">
              Historial de Jornadas Anteriores
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-surface-container border border-surface-container-high text-xs">
                <div className="flex items-center justify-between font-mono text-[11px] text-secondary mb-1">
                  <span>14/MAY/2024</span>
                  <span className="text-tertiary font-bold">CUS-02</span>
                </div>
                <div className="font-semibold text-on-surface">Campaña Urubamba Centro</div>
                <div className="text-[11px] text-on-surface-variant mt-1">
                  PA: 140/90 • Glucemia: 105 • Dx: HTA Grado I • Rx: Enalapril 10mg
                </div>
              </div>

              <div className="p-3 bg-surface-container border border-surface-container-high text-xs">
                <div className="flex items-center justify-between font-mono text-[11px] text-secondary mb-1">
                  <span>02/NOV/2023</span>
                  <span className="text-tertiary font-bold">CUS-01</span>
                </div>
                <div className="font-semibold text-on-surface">Campaña Ollantaytambo</div>
                <div className="text-[11px] text-on-surface-variant mt-1">
                  PA: 130/85 • Dolor osteoarticular • Rx: Ibuprofeno 400mg
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
