import { useState } from 'react'
import { useScannerStore } from '../../store/scannerStore'
import { PATIENT_DATABASE } from '../../services/patientRegistry'

interface QueuePatient {
  id: number
  ticket: string
  priority: 'rojo' | 'amarillo' | 'verde'
  paciente: string
  edad: string
  dni: string
  hora: string
  espera: string
  vitals: string[]
  motivo: string
  detalles: string
  destino: string
  alergia?: string
}

const mockPatients: QueuePatient[] = [
  {
    id: 1,
    ticket: 'T-101',
    priority: 'rojo',
    paciente: 'Mamani Quispe, Rosa',
    edad: '67 años',
    dni: '02817462',
    hora: '09:12 hrs',
    espera: '3 min',
    vitals: ['PA: 180/110', 'SpO2: 84%'],
    motivo: 'Crisis hipertensiva y disnea severa',
    detalles: 'Cianosis distal, dolor torácico opresivo en reposo.',
    destino: 'Consultorio 1',
    alergia: 'Alergia a Penicilina',
  },
  {
    id: 2,
    ticket: 'T-102',
    priority: 'rojo',
    paciente: 'Huallpa Ccori, Dylan',
    edad: '3 años',
    dni: '78291043',
    hora: '09:14 hrs',
    espera: '1 min',
    vitals: ['T°: 39.8°C', 'FC: 142'],
    motivo: 'Fiebre muy alta con episodio convulsivo',
    detalles: 'Convulsión febril reportada por madre hace 20 min.',
    destino: 'Consultorio 2',
  },
  {
    id: 3,
    ticket: 'T-104',
    priority: 'amarillo',
    paciente: 'Quispe Condori, Juan',
    edad: '54 años',
    dni: '42918274',
    hora: '08:42 hrs',
    espera: '28 min',
    vitals: ['PA: 145/95', 'T°: 38.6°C', 'SpO2: 92%'],
    motivo: 'Lumbago incapacitante y síndrome febril',
    detalles: 'Marcha claudicante, cefalea frontal y malestar.',
    destino: 'Consultorio 1',
    alergia: 'Penicilina / Betalactámicos',
  },
  {
    id: 4,
    ticket: 'T-105',
    priority: 'amarillo',
    paciente: 'Ramos Condori, Hilda',
    edad: '31 años',
    dni: '48920194',
    hora: '08:50 hrs',
    espera: '20 min',
    vitals: ['PA: 110/70', 'FC: 92'],
    motivo: 'Gestante 28 semanas con cefalea y acúfenos',
    detalles: 'Sospecha de preeclampsia leve en altura.',
    destino: 'Consultorio 2',
  },
  {
    id: 5,
    ticket: 'T-107',
    priority: 'verde',
    paciente: 'Yupanqui Champi, Pedro',
    edad: '45 años',
    dni: '23940182',
    hora: '08:20 hrs',
    espera: '50 min',
    vitals: ['PA: 120/80', 'SpO2: 94%'],
    motivo: 'Control anual y solicitud de desparasitación',
    detalles: 'Asintomático. Certificado médico comunal.',
    destino: 'Consultorio 1',
  },
  {
    id: 6,
    ticket: 'T-108',
    priority: 'verde',
    paciente: 'Chavez Flores, María',
    edad: '62 años',
    dni: '03829104',
    hora: '08:35 hrs',
    espera: '35 min',
    vitals: ['PA: 125/82', 'SpO2: 93%'],
    motivo: 'Artrosis de rodilla bilateral y lumbalgia crónica',
    detalles: 'Dificultad para caminar largas distancias.',
    destino: 'Consultorio 1',
  },
]

export default function QueuePage() {
  const { openScanner, showPatientDetail } = useScannerStore()
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterConsultorio, setFilterConsultorio] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<QueuePatient | null>(null)
  const [thermalPatient, setThermalPatient] = useState<QueuePatient | null>(null)
  const [calledMessage, setCalledMessage] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(true)

  const patients = mockPatients.filter((p) => {
    if (filterPriority !== 'all' && p.priority !== filterPriority) return false
    if (filterConsultorio === 'c1' && p.destino !== 'Consultorio 1') return false
    if (filterConsultorio === 'c2' && p.destino !== 'Consultorio 2') return false
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      return (
        p.paciente.toLowerCase().includes(q) ||
        p.ticket.toLowerCase().includes(q) ||
        p.dni.includes(q)
      )
    }
    return true
  })

  const countRojo = mockPatients.filter((p) => p.priority === 'rojo').length
  const countAmarillo = mockPatients.filter((p) => p.priority === 'amarillo').length
  const countVerde = mockPatients.filter((p) => p.priority === 'verde').length

  const handleCall = (p: QueuePatient) => {
    setCalledMessage(`Llamando: ${p.ticket} - ${p.paciente} a ${p.destino}`)
    setTimeout(() => setCalledMessage(null), 4000)
  }

  const handlePrintSlip = (p: QueuePatient) => {
    setThermalPatient(p)
  }

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Carbon Emergency Floating Toast (Style 05_cola_espera_triage_carbon.html) */}
      {showToast && (
        <div className="fixed top-16 right-6 z-50 flex items-start bg-error-container text-on-error-container p-4 shadow-md max-w-md border border-error/30 transition-all duration-300">
          <span className="material-symbols-outlined text-error mr-3 text-[22px] shrink-0">emergency</span>
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-error">Alerta Roja Inmediata</span>
              <span className="text-[11px] text-on-surface-variant font-mono">09:15:02</span>
            </div>
            <p className="text-xs font-medium text-on-surface mt-1 leading-snug">
              Paciente pediátrico derivado con T° 39.8°C (Ticket #T-102). Prioridad 1 Manchester asignada a Consultorio 2.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="text-on-surface-variant hover:text-on-surface flex items-center p-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Audio call feedback snackbar (fixed bottom right) */}
      {calledMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 shadow-xl flex items-center gap-3 border border-surface-container-highest animate-bounce">
          <span className="material-symbols-outlined text-primary-fixed-dim text-[24px]">volume_up</span>
          <div className="text-xs">
            <span className="font-bold block">{calledMessage}</span>
            <span className="text-[11px] text-surface-container-highest">
              Emisión enviada al parlante de sala comunal y pantalla de llamado
            </span>
          </div>
        </div>
      )}

      {/* Operational Metrics: IBM Carbon KPI Bento */}
      <section className="mb-6">
        <div className="flex flex-wrap items-end justify-between mb-3 gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-primary">monitoring</span>
              Control de Flujo de Atención Médica en Tiempo Real
            </div>
            <h1 className="text-xl font-semibold text-on-surface tracking-tight">Cola de Espera Activa</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-surface px-2.5 py-1 text-xs text-on-surface font-mono border border-surface-container-high">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              ACTUALIZACIÓN EN VIVO (5s)
            </span>
            <button
              type="button"
              className="flex items-center gap-1 bg-surface px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container transition-colors border border-surface-container-high cursor-pointer rounded-none"
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">sync</span>
              Refrescar
            </button>
          </div>
        </div>

        {/* Carbon Data Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          {/* Total en Cola */}
          <div className="bg-surface p-4 flex flex-col justify-between shadow-xs border border-surface-container-high">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Total en Cola
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-light text-on-surface tracking-tight">
                {mockPatients.length}
              </span>
              <span className="text-xs text-on-surface-variant font-mono">Pacientes</span>
            </div>
            <div className="mt-2 h-1 w-full bg-surface-container">
              <div className="h-1 bg-primary" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Prioridad Roja (Crítico) */}
          <div className="bg-surface p-4 flex flex-col justify-between shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-error font-semibold flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-error" />
                </span>
                P1 - Emergencia
              </span>
              <span className="material-symbols-outlined text-error text-[18px]">e911_emergency</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-light text-error font-mono">{countRojo}</span>
              <span className="text-xs text-error font-mono font-medium">&lt; 0 min</span>
            </div>
            <div className="mt-2 h-1 w-full bg-surface-container">
              <div className="h-1 bg-error" style={{ width: `${(countRojo / mockPatients.length) * 100}%` }} />
            </div>
          </div>

          {/* Prioridad Amarilla (Urgente) */}
          <div className="bg-surface p-4 flex flex-col justify-between shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[#b28600] font-semibold">
                P2 - Urgente
              </span>
              <span className="material-symbols-outlined text-[#b28600] text-[18px]">notification_important</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-light text-[#b28600] font-mono">{countAmarillo}</span>
              <span className="text-xs text-[#b28600] font-mono font-medium">&lt; 15 min</span>
            </div>
            <div className="mt-2 h-1 w-full bg-surface-container">
              <div className="h-1 bg-[#f1c21b]" style={{ width: `${(countAmarillo / mockPatients.length) * 100}%` }} />
            </div>
          </div>

          {/* Prioridad Verde */}
          <div className="bg-surface p-4 flex flex-col justify-between shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-tertiary font-semibold">
                P3 - Estándar
              </span>
              <span className="material-symbols-outlined text-tertiary text-[18px]">health_and_safety</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-light text-tertiary font-mono">{countVerde}</span>
              <span className="text-xs text-tertiary font-mono font-medium">&lt; 60 min</span>
            </div>
            <div className="mt-2 h-1 w-full bg-surface-container">
              <div className="h-1 bg-tertiary" style={{ width: `${(countVerde / mockPatients.length) * 100}%` }} />
            </div>
          </div>

          {/* Tiempo Medio de Espera */}
          <div className="bg-surface p-4 flex flex-col justify-between shadow-xs border border-surface-container-high">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Espera Media
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-light text-on-surface tracking-tight">18</span>
              <span className="text-xs text-on-surface-variant font-mono">minutos</span>
            </div>
            <div className="mt-2 text-[10px] text-tertiary font-medium">Dentro de meta clínica</div>
          </div>

          {/* Atendidos Hoy */}
          <div className="bg-surface p-4 flex flex-col justify-between shadow-xs border border-surface-container-high">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Atendidos Hoy
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-light text-primary font-mono">114</span>
              <span className="text-xs text-on-surface-variant font-mono">Consultas</span>
            </div>
            <div className="mt-2 text-[10px] text-primary font-medium">80.2% tasa de avance</div>
          </div>
        </div>
      </section>

      {/* Filter and Command Toolbar */}
      <div className="bg-surface p-3 mb-1 border border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search & Scan */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">search</span>
            <input
              type="text"
              placeholder="Buscar por DNI, paciente o #Ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-surface-container-low text-xs text-on-surface border border-surface-container-high focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={openScanner}
            className="h-9 px-3 bg-primary text-on-primary hover:bg-on-primary-fixed-variant text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Escanear Ticket QR para ver datos completos del paciente"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span className="hidden sm:inline">Escanear Ticket</span>
          </button>
        </div>

        {/* Priority Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFilterPriority('all')}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded-none cursor-pointer ${
              filterPriority === 'all'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Todos ({mockPatients.length})
          </button>
          <button
            onClick={() => setFilterPriority('rojo')}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 rounded-none cursor-pointer ${
              filterPriority === 'rojo'
                ? 'bg-error text-on-error'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-error" /> Rojo ({countRojo})
          </button>
          <button
            onClick={() => setFilterPriority('amarillo')}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 rounded-none cursor-pointer ${
              filterPriority === 'amarillo'
                ? 'bg-[#f1c21b] text-[#161616]'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#b28600]" /> Amarillo ({countAmarillo})
          </button>
          <button
            onClick={() => setFilterPriority('verde')}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 rounded-none cursor-pointer ${
              filterPriority === 'verde'
                ? 'bg-tertiary text-on-tertiary'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-tertiary" /> Verde ({countVerde})
          </button>

          {/* Consultorio Filter */}
          <div className="relative ml-2">
            <select
              value={filterConsultorio}
              onChange={(e) => setFilterConsultorio(e.target.value)}
              className="bg-surface-container text-xs text-on-surface py-1.5 px-3 pr-7 focus:outline-none border border-surface-container-high appearance-none cursor-pointer font-medium"
            >
              <option value="all">Todos los Consultorios</option>
              <option value="c1">Consultorio 1 (Med. General)</option>
              <option value="c2">Consultorio 2 (Pediatría)</option>
            </select>
            <span className="material-symbols-outlined absolute right-1.5 top-2 pointer-events-none text-secondary text-[16px]">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Active Filter Chips / Status bar */}
      <div className="px-4 py-2 bg-surface-container flex items-center justify-between text-xs text-on-surface-variant border border-surface-container-high mb-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-on-surface">Mostrando:</span>
          <span className="font-mono text-primary font-bold">
            {patients.length} de {mockPatients.length} pacientes filtrados
          </span>
          <span className="text-surface-container-highest">|</span>
          <span className="text-[11px]">
            Orden: <strong className="text-on-surface">Prioridad Manchester + Tiempo de Espera</strong>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-error" /> Prioridad I (&lt;10m)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-[#b28600]" /> Prioridad II (&lt;30m)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-tertiary" /> Prioridad III (&lt;60m)
          </span>
        </div>
      </div>

      {/* IBM Carbon Data Table */}
      <div className="bg-surface shadow-xs border border-surface-container-high overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-surface-container text-on-surface-variant uppercase text-[11px] tracking-wider font-semibold border-b border-surface-container-high">
            <tr>
              <th className="p-3">Ticket #</th>
              <th className="p-3">Nivel Urgencia</th>
              <th className="p-3">Triaje / Espera</th>
              <th className="p-3">Paciente</th>
              <th className="p-3">Signos Vitales Alerta</th>
              <th className="p-3">Motivo Principal</th>
              <th className="p-3">Destino</th>
              <th className="p-3 text-right pr-4">Acción Operativa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high font-normal text-on-surface">
            {patients.map((p) => {
              const isRojo = p.priority === 'rojo'
              const isAmarillo = p.priority === 'amarillo'
              return (
                <tr
                  key={p.id}
                  className={`hover:bg-surface-container transition-colors ${
                    isRojo ? 'bg-error-container/20' : 'bg-surface'
                  }`}
                >
                  <td className="p-3 font-mono font-bold text-sm text-on-surface flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-6 shrink-0 ${
                        isRojo ? 'bg-error' : isAmarillo ? 'bg-[#f1c21b]' : 'bg-tertiary'
                      }`}
                    />
                    {p.ticket}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isRojo
                          ? 'bg-error text-on-error'
                          : isAmarillo
                          ? 'bg-[#f1c21b] text-[#161616]'
                          : 'bg-tertiary text-on-tertiary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {isRojo ? 'priority_high' : isAmarillo ? 'notification_important' : 'health_and_safety'}
                      </span>
                      {isRojo ? 'Rojo - Emergencia' : isAmarillo ? 'Amarillo - Urgente' : 'Verde - Normal'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-mono text-xs font-semibold">{p.hora}</div>
                    <div className="text-[11px] text-secondary font-mono flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">timer</span> Espera: {p.espera}
                    </div>
                  </td>
                  <td className="p-3 min-w-[180px]">
                    <div
                      onClick={() => setSelectedPatient(p)}
                      className="font-semibold text-on-surface hover:text-primary transition-colors cursor-pointer"
                    >
                      {p.paciente}
                    </div>
                    <div className="text-[11px] text-on-surface-variant font-mono">
                      {p.edad} | DNI: {p.dni}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {p.vitals.map((v, i) => (
                        <span
                          key={i}
                          className="bg-surface-container font-mono text-[11px] font-semibold px-1.5 py-0.5 border border-surface-container-high"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 max-w-xs">
                    <p className={`truncate font-medium leading-snug ${isRojo ? 'text-error' : 'text-on-surface'}`}>
                      {p.motivo}
                    </p>
                    <p className="text-[11px] text-on-surface-variant truncate">{p.detalles}</p>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="bg-surface-container px-2 py-1 font-mono text-xs font-medium text-on-surface border border-surface-container-high">
                      {p.destino}
                    </span>
                  </td>
                  <td className="p-3 text-right pr-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleCall(p)}
                        className="bg-primary hover:bg-on-primary-fixed-variant text-on-primary px-3 py-1.5 font-semibold text-xs uppercase tracking-wider flex items-center gap-1 transition-colors shadow-xs cursor-pointer rounded-none"
                      >
                        <span className="material-symbols-outlined text-[16px]">campaign</span>
                        Llamar
                      </button>
                      <button
                        onClick={() => handlePrintSlip(p)}
                        title="Imprimir Ticket Térmico"
                        className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-surface-container-high transition-colors cursor-pointer rounded-none"
                      >
                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                      </button>
                      <button
                        onClick={() => {
                          const full = PATIENT_DATABASE.find((pt) => pt.ticket === p.ticket)
                          if (full) showPatientDetail(full)
                          else setSelectedPatient(p)
                        }}
                        title="Ver Ficha Clínica Completa / QR"
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container border border-surface-container-high transition-colors cursor-pointer rounded-none"
                      >
                        <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                      </button>
                      <button
                        onClick={() => setSelectedPatient(p)}
                        title="Ver resumen rápido"
                        className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-surface-container-high transition-colors cursor-pointer rounded-none"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Quick Action Buttons (pulgar derecho) */}
      <div className="md:hidden grid grid-cols-2 gap-2 my-2">
        <button
          type="button"
          onClick={openScanner}
          className="h-11 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs flex items-center justify-center gap-2 border border-surface-container-high transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl text-primary">qr_code_scanner</span>
          <span>Escanear Ticket</span>
        </button>
        <button
          type="button"
          onClick={() => {
            const p = PATIENT_DATABASE[0]
            if (p) showPatientDetail(p)
          }}
          className="h-11 bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">medical_information</span>
          <span>Ficha Paciente</span>
        </button>
      </div>

      {/* Mobile Tactile Vertical Cards (from 03_cola_espera_triage_movil.html) */}
      <div className="md:hidden flex flex-col gap-3 mt-3">
        {patients.map((p) => {
          const isRojo = p.priority === 'rojo'
          const isAmarillo = p.priority === 'amarillo'
          return (
            <article key={p.id} className="bg-surface p-3.5 flex flex-col gap-2.5 relative border border-surface-container-high shadow-xs">
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isRojo ? 'bg-error' : isAmarillo ? 'bg-[#f1c21b]' : 'bg-tertiary'
                }`}
              />
              <div className="flex items-start justify-between gap-2 pl-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs font-bold px-1.5 py-0.5 ${
                      isRojo ? 'bg-error text-on-error' : isAmarillo ? 'bg-[#f1c21b] text-[#161616]' : 'bg-tertiary text-on-tertiary'
                    }`}
                  >
                    #{p.ticket}
                  </span>
                  <span
                    className={`text-xs font-bold uppercase tracking-wide ${
                      isRojo ? 'text-error' : isAmarillo ? 'text-[#b28600]' : 'text-tertiary'
                    }`}
                  >
                    {isRojo ? 'Emergencia' : isAmarillo ? 'Urgente' : 'Estándar'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    {p.hora}
                  </span>
                </div>
              </div>

              <div className="pl-1.5">
                <div className="flex items-baseline justify-between">
                  <h2
                    onClick={() => {
                      const full = PATIENT_DATABASE.find((pt) => pt.ticket === p.ticket)
                      if (full) showPatientDetail(full)
                      else setSelectedPatient(p)
                    }}
                    className="text-base font-bold text-on-surface leading-tight cursor-pointer hover:text-primary"
                  >
                    {p.paciente}
                  </h2>
                  <span className="text-xs text-on-surface-variant font-mono">{p.edad}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {p.vitals.map((v, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-mono font-semibold bg-surface-container text-on-surface px-2 py-0.5 border border-surface-container-high"
                    >
                      {v}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant mt-2 line-clamp-1">
                  <strong className="text-on-surface font-semibold">Motivo:</strong> {p.motivo}
                </p>
              </div>

              <div className="pl-1.5 pt-2 flex items-center justify-between gap-2 bg-surface-container-low p-2 border-t border-surface-container-high">
                <div className="flex items-center gap-1.5 text-xs font-medium text-on-surface truncate">
                  <span className="material-symbols-outlined text-base text-primary">stethoscope</span>
                  <span>Destino: <strong>{p.destino}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const full = PATIENT_DATABASE.find((pt) => pt.ticket === p.ticket)
                      if (full) showPatientDetail(full)
                      else setSelectedPatient(p)
                    }}
                    title="Ficha Médica QR"
                    className="h-9 px-2 bg-surface text-on-surface hover:text-primary border border-surface-container-high text-xs font-mono flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">qr_code_2</span>
                  </button>
                  <button
                    onClick={() => handlePrintSlip(p)}
                    title="Imprimir Ticket"
                    className="h-9 px-2.5 bg-surface text-on-surface border border-surface-container-high text-xs font-mono flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">receipt_long</span>
                  </button>
                  <button
                    onClick={() => handleCall(p)}
                    className="h-9 px-3 bg-primary text-on-primary hover:bg-on-primary-fixed-variant text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">campaign</span>
                    Llamar
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-container-high max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-bold text-primary">#{selectedPatient.ticket}</span>
                <span className="text-base font-semibold text-on-surface">{selectedPatient.paciente}</span>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-surface-container border border-surface-container-high">
                <div>
                  <span className="text-secondary block text-[10px] uppercase">DNI:</span>
                  <span className="font-mono font-bold">{selectedPatient.dni}</span>
                </div>
                <div>
                  <span className="text-secondary block text-[10px] uppercase">Edad:</span>
                  <span>{selectedPatient.edad}</span>
                </div>
                <div>
                  <span className="text-secondary block text-[10px] uppercase">Hora Triaje:</span>
                  <span className="font-mono">{selectedPatient.hora}</span>
                </div>
                <div>
                  <span className="text-secondary block text-[10px] uppercase">Destino:</span>
                  <span className="font-semibold text-primary">{selectedPatient.destino}</span>
                </div>
              </div>

              {selectedPatient.alergia && (
                <div className="p-2.5 bg-error-container text-on-error-container border border-error/30 flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-base">warning</span>
                  <span className="font-bold">{selectedPatient.alergia}</span>
                </div>
              )}

              <div>
                <div className="text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1">
                  Constantes Vitales
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPatient.vitals.map((v, i) => (
                    <span key={i} className="px-2 py-1 bg-surface-container border border-surface-container-high font-mono">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1">
                  Motivo &amp; Observaciones
                </div>
                <p className="p-2 bg-surface-container border border-surface-container-high">
                  {selectedPatient.motivo}. {selectedPatient.detalles}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-surface-container text-xs font-semibold uppercase hover:bg-surface-container-high transition-colors cursor-pointer rounded-none"
              >
                Cerrar
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handlePrintSlip(selectedPatient)
                    setSelectedPatient(null)
                  }}
                  className="px-3 py-2 bg-surface hover:bg-surface-container text-xs font-semibold uppercase flex items-center gap-1.5 border border-surface-container-high cursor-pointer rounded-none"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">print</span>
                  Imprimir Ticket
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCall(selectedPatient)
                    setSelectedPatient(null)
                  }}
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider hover:bg-on-primary-fixed-variant transition-colors cursor-pointer rounded-none flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">campaign</span>
                  Llamar a Box
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Ticket Modal (from 05_cola_espera_triage_carbon.html) */}
      {thermalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface max-w-sm w-full p-5 shadow-2xl border border-surface-container-high font-mono text-on-surface">
            <div className="flex items-center justify-between pb-2 bg-surface-container p-2 mb-3 border border-surface-container-high">
              <span className="text-xs font-semibold text-on-surface-variant uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">receipt</span>
                Vista Previa Ticket Térmico 58mm
              </span>
              <button
                onClick={() => setThermalPatient(null)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Thermal Paper Emulation */}
            <div className="bg-[#fafafa] text-[#111111] p-4 text-center border border-[#d0d0d0] space-y-2 text-xs select-none">
              <div className="font-bold text-sm tracking-tight text-black">ONG SEMILLA SALUD</div>
              <div className="text-[10px] text-secondary">CAMPAÑA VALLE SAGRADO 2025</div>
              <div className="text-[10px] text-secondary">********************************</div>
              <div className="py-1">
                <div className="text-3xl font-extrabold text-black">#{thermalPatient.ticket}</div>
                <div className={`text-[11px] font-bold mt-1 uppercase ${
                  thermalPatient.priority === 'rojo' ? 'text-error' : thermalPatient.priority === 'amarillo' ? 'text-[#b28600]' : 'text-tertiary'
                }`}>
                  {thermalPatient.priority === 'rojo' ? 'ROJO - EMERGENCIA' : thermalPatient.priority === 'amarillo' ? 'AMARILLO - URGENTE' : 'VERDE - NORMAL'}
                </div>
              </div>
              <div className="text-[10px] text-secondary">--------------------------------</div>
              <div className="text-left text-[11px] space-y-1">
                <div><strong className="text-black">PACIENTE:</strong> <span className="text-black">{thermalPatient.paciente}</span></div>
                <div><strong className="text-black">DNI:</strong> <span className="text-black">{thermalPatient.dni}</span></div>
                <div><strong className="text-black">HORA:</strong> <span className="text-black">{thermalPatient.hora}</span></div>
                <div><strong className="text-black">DESTINO:</strong> <span className="text-black">{thermalPatient.destino}</span></div>
              </div>
              <div className="text-[10px] text-secondary">--------------------------------</div>
              <div className="text-[9px] leading-tight text-secondary">
                Conserve este ticket. Esté atento a los altavoces y pantallas de llamado.
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setThermalPatient(null)}
                className="flex-1 py-2 bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer rounded-none border border-surface-container-high"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalledMessage(`Comando ESC/POS enviado a impresora para #${thermalPatient.ticket}`)
                  setThermalPatient(null)
                  setTimeout(() => setCalledMessage(null), 3000)
                }}
                className="flex-1 py-2 bg-primary text-on-primary text-xs font-semibold flex items-center justify-center gap-1 hover:bg-on-primary-fixed-variant transition-colors shadow-xs cursor-pointer rounded-none"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                Emitir Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
