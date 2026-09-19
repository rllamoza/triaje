import { useState } from 'react'
import { useNodeStatus } from '../../api/hooks'

const syncLogs = [
  { id: 1, time: '09:22:14', event: 'REPLICATE_PATIENT_RECORDS', source: 'CUS-VALLE-04', dest: 'ALL_PEERS_MESH', status: 'OK' },
  { id: 2, time: '09:21:50', event: 'RENIEC_CACHE_HIT_LOCAL', source: 'ADM-01', dest: 'SQLITE_LOCAL', status: 'OK' },
  { id: 3, time: '09:20:14', event: 'THERMAL_TICKET_DISPATCH', source: 'TRJ-01', dest: 'BT-POS-01', status: 'OK' },
  { id: 4, time: '09:18:02', event: 'STARLINK_HEARTBEAT_TELEMETRY', source: 'GATEWAY_ROUTER', dest: 'CLOUD_CENTRAL', status: 'OK' },
  { id: 5, time: '09:15:30', event: 'P2P_MESH_PEER_DISCOVERY', source: 'CUS-VALLE-04', dest: 'TRJ-02', status: 'OK' },
]

export default function TelemetriaPage() {
  const { data: nodeStatus, refetch } = useNodeStatus()
  const [testingConnection, setTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const handleTestPing = () => {
    setTestingConnection(true)
    setTestResult(null)
    setTimeout(() => {
      setTestingConnection(false)
      setTestResult('Ping exitoso a gateway Starlink: Latencia 36ms • Pérdida de paquetes: 0%')
      refetch()
    }, 1000)
  }

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Header Contextual Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-primary-container text-on-primary-fixed">
              NOC-08
            </span>
            <span className="px-2 py-0.5 text-[11px] font-medium bg-surface-container text-on-surface-variant flex items-center gap-1.5 border border-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              Nodo Maestro: Minisforum Edge Core v4.2
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-on-surface">
            Telemetría Satelital <span className="font-semibold text-primary">&amp; Replicación P2P Mesh</span>
          </h1>
        </div>

        <button
          type="button"
          disabled={testingConnection}
          onClick={handleTestPing}
          className="h-10 px-4 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-none shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">satellite_alt</span>
          <span>{testingConnection ? 'Enviando Ping...' : 'Probar Conectividad Starlink'}</span>
        </button>
      </div>

      {testResult && (
        <div className="p-3 mb-6 bg-tertiary-container text-on-tertiary-container text-xs flex items-center gap-2 border border-tertiary/30 font-semibold">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{testResult}</span>
        </div>
      )}

      {/* Bento Grid: Telemetry & Integrations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Starlink Mini */}
        <div className="bg-surface p-5 border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant block mb-1">
                ENLACE SATELITAL WAN
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-on-surface">Starlink Mini</span>
              </div>
              <span className="text-[11px] text-tertiary font-medium">Antena Orientada (38° Azim)</span>
            </div>
            <div className="w-9 h-9 bg-primary-container text-primary flex items-center justify-center rounded-none">
              <span className="material-symbols-outlined text-[20px]">satellite_alt</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-on-surface-variant">
              <span>Latencia satelital:</span>
              <span className="font-mono font-bold text-on-surface">{nodeStatus?.latency_ms ?? 38} ms</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Estado energía UPS:</span>
              <span className="font-mono font-bold text-tertiary">{nodeStatus?.battery_pct ?? 94}% Batería</span>
            </div>
          </div>
        </div>

        {/* Card 2: SQLite P2P Mesh */}
        <div className="bg-surface p-5 border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant block mb-1">
                REPLICACIÓN P2P MESH
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-on-surface">142 / 142</span>
              </div>
              <span className="text-[11px] text-tertiary font-medium">100% Sincronizado</span>
            </div>
            <div className="w-9 h-9 bg-tertiary-container text-on-tertiary-container flex items-center justify-center rounded-none">
              <span className="material-symbols-outlined text-[20px]">sync_saved_locally</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-on-surface-variant">
              <span>Nodos en red mesh:</span>
              <span className="font-mono font-bold text-on-surface">6 dispositivos</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Tickets térmicos emitidos:</span>
              <span className="font-mono font-bold text-on-surface">104 tickets</span>
            </div>
          </div>
        </div>

        {/* Card 3: Consultas RENIEC */}
        <div className="bg-surface p-5 border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant block mb-1">
                CONSULTAS RENIEC / PADRÓN
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-on-surface">142</span>
                <span className="text-xs text-secondary">consultas</span>
              </div>
              <span className="text-[11px] text-tertiary font-medium">98.6% tasa de éxito</span>
            </div>
            <div className="w-9 h-9 bg-surface-container text-on-surface flex items-center justify-center rounded-none">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-on-surface-variant">
              <span>Aciertos SQLite Local:</span>
              <span className="font-mono font-bold text-tertiary">85% (121 req)</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Ahorro WAN satelital:</span>
              <span className="font-mono text-secondary">~14.8 MB</span>
            </div>
          </div>
        </div>

        {/* Card 4: Webhooks & POS */}
        <div className="bg-surface p-5 border border-surface-container-high shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant block mb-1">
                IMPRESIÓN ESC/POS BLUETOOTH
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-on-surface">{nodeStatus?.printer ?? 'BT-POS-01'}</span>
              </div>
              <span className="text-[11px] text-tertiary font-medium">Conexión SPP Estable</span>
            </div>
            <div className="w-9 h-9 bg-surface-container text-on-surface flex items-center justify-center rounded-none">
              <span className="material-symbols-outlined text-[20px]">print</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-on-surface-variant">
              <span>Baudrate:</span>
              <span className="font-mono font-bold text-on-surface">115200 (8N1)</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Sensor de papel:</span>
              <span className="font-mono text-tertiary">OK (Rollo con carga)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Topology Nodes Grid */}
      <div className="bg-surface p-6 border border-surface-container-high shadow-xs mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">hub</span>
          Topología de Estaciones en Campaña (P2P Local)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'NODO-CORE', ip: '192.168.8.1', role: 'Servidor Local', status: 'Online' },
            { name: 'ADMISION-01', ip: '192.168.8.10', role: 'Filiación DNI', status: 'Online' },
            { name: 'TRIAJE-01', ip: '192.168.8.20', role: 'Somatometría', status: 'Online' },
            { name: 'TRIAJE-02', ip: '192.168.8.21', role: 'Urgencias', status: 'Online' },
            { name: 'CONSULTORIO-1', ip: '192.168.8.30', role: 'Med. General', status: 'Online' },
            { name: 'FARMACIA-01', ip: '192.168.8.40', role: 'Botiquín', status: 'Online' },
          ].map((node) => (
            <div key={node.name} className="p-3 bg-surface-container border border-surface-container-high text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-on-surface">{node.name}</span>
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              </div>
              <div className="text-[11px] font-mono text-secondary">{node.ip}</div>
              <div className="text-[10px] text-on-surface-variant mt-1 font-semibold uppercase">{node.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync Log Table */}
      <div className="bg-surface border border-surface-container-high shadow-xs">
        <div className="p-4 border-b border-surface-container-high flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface">
            Registro de Eventos y Sincronización en Tiempo Real
          </h3>
          <span className="text-xs font-mono text-secondary">Últimos eventos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-container text-on-surface-variant uppercase text-[11px] tracking-wider font-semibold border-b border-surface-container-high">
              <tr>
                <th className="py-2.5 px-4">Hora</th>
                <th className="py-2.5 px-4">Evento de Red</th>
                <th className="py-2.5 px-4">Nodo Origen</th>
                <th className="py-2.5 px-4">Destino</th>
                <th className="py-2.5 px-4 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high font-mono text-on-surface">
              {syncLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-container transition-colors">
                  <td className="py-2.5 px-4 text-secondary">{log.time}</td>
                  <td className="py-2.5 px-4 font-bold text-primary">{log.event}</td>
                  <td className="py-2.5 px-4">{log.source}</td>
                  <td className="py-2.5 px-4 text-secondary">{log.dest}</td>
                  <td className="py-2.5 px-4 text-right">
                    <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container font-bold text-[10px]">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
