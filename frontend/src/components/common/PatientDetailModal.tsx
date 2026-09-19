import { useNavigate } from 'react-router-dom'
import type { DetailedPatient } from '../../services/patientRegistry'

interface PatientDetailModalProps {
  patient: DetailedPatient | null
  onClose: () => void
}

export function PatientDetailModal({ patient, onClose }: PatientDetailModalProps) {
  const navigate = useNavigate()

  if (!patient) return null

  const isRojo = patient.prioridad === 'rojo'
  const isAmarillo = patient.prioridad === 'amarillo'

  const priorityBg = isRojo
    ? 'bg-error text-on-error'
    : isAmarillo
    ? 'bg-[#f1c21b] text-[#161616]'
    : 'bg-tertiary text-on-tertiary'

  const priorityBorder = isRojo
    ? 'border-error'
    : isAmarillo
    ? 'border-[#b28600]'
    : 'border-tertiary'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-surface max-w-2xl w-full my-auto shadow-2xl border border-surface-container-high font-sans text-on-surface flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-surface-container border-b border-surface-container-high flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[24px]">verified_user</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-on-surface flex items-center gap-2">
                Ficha Clínica Integral del Paciente
              </h2>
              <p className="text-xs text-on-surface-variant font-mono">
                Identificación por Código QR • Sincronización Local Desconectada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high cursor-pointer transition-colors"
            title="Cerrar modal"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Main Identification Banner */}
          <div className={`p-4 border-l-4 ${priorityBorder} bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-14 h-14 shrink-0 bg-primary-container text-on-primary-container flex flex-col items-center justify-center font-mono border border-primary/20 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider">Ticket</span>
                <span className="text-xl font-black">{patient.ticket}</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-on-surface uppercase tracking-tight">
                    {patient.paciente}
                  </h3>
                  <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant font-mono font-bold text-[11px]">
                    DNI: {patient.dni}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-on-surface-variant text-[11.5px]">
                  <span><strong>Edad:</strong> {patient.edad}</span>
                  <span>•</span>
                  <span><strong>Sexo:</strong> {patient.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
                  <span>•</span>
                  <span><strong>Seguro:</strong> {patient.seguro}</span>
                </div>
                <div className="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-primary">location_on</span>
                  <span>{patient.comunidad}</span>
                </div>
              </div>
            </div>

            {/* Priority Badge */}
            <div className="sm:text-right shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider ${priorityBg}`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {patient.prioridadLabel}
              </span>
              <div className="text-[10px] text-on-surface-variant font-mono mt-1">
                Llegada: {patient.hora} ({patient.espera} espera)
              </div>
            </div>
          </div>

          {/* Critical Allergy Warning */}
          {patient.alergias && patient.alergias.toLowerCase() !== 'ninguna' && (
            <div className="p-3 bg-error-container/20 border border-error/40 flex items-start gap-2.5 text-error">
              <span className="material-symbols-outlined text-[20px] shrink-0 text-error">warning</span>
              <div>
                <div className="font-bold uppercase tracking-wider text-[11px]">Alerta Clínica Crítica: Alergias</div>
                <div className="text-[12px] font-semibold text-on-surface mt-0.5">{patient.alergias}</div>
              </div>
            </div>
          )}

          {/* Medical Antecedents & Consultation Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 bg-surface-container-low border border-surface-container-high">
              <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">clinical_notes</span>
                Motivo de Consulta y Síntomas
              </div>
              <p className="text-xs font-semibold text-on-surface">{patient.motivo}</p>
              {patient.detalles && (
                <p className="text-[11px] text-on-surface-variant mt-1 italic">{patient.detalles}</p>
              )}
            </div>

            <div className="p-3.5 bg-surface-container-low border border-surface-container-high">
              <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">history_edu</span>
                Antecedentes Médicos Relevantes
              </div>
              <p className="text-xs text-on-surface font-medium">{patient.antecedentes ?? 'Sin antecedentes de riesgo registrados'}</p>
              {patient.telefono && (
                <div className="mt-2 text-[11px] text-on-surface-variant">
                  <strong>Contacto / Celular:</strong> {patient.telefono}
                </div>
              )}
            </div>
          </div>

          {/* Vital Signs Grid */}
          <div className="p-4 bg-surface-container-low border border-surface-container-high">
            <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">vital_signs</span>
                Constantes Vitales Registradas en Triaje
              </span>
              <span className="text-[10px] font-mono text-tertiary font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Medición Validada
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <div className="p-2.5 bg-surface border border-surface-container-high text-center">
                <span className="text-[10px] text-on-surface-variant font-mono uppercase block">Presión Art.</span>
                <span className="text-sm font-bold font-mono text-on-surface">{patient.vitals.pa}</span>
              </div>
              <div className="p-2.5 bg-surface border border-surface-container-high text-center">
                <span className="text-[10px] text-on-surface-variant font-mono uppercase block">Frec. Cardíaca</span>
                <span className="text-sm font-bold font-mono text-on-surface">{patient.vitals.fc}</span>
              </div>
              <div className="p-2.5 bg-surface border border-surface-container-high text-center">
                <span className="text-[10px] text-on-surface-variant font-mono uppercase block">Temperatura</span>
                <span className="text-sm font-bold font-mono text-on-surface">{patient.vitals.temp}</span>
              </div>
              <div className="p-2.5 bg-surface border border-surface-container-high text-center">
                <span className="text-[10px] text-on-surface-variant font-mono uppercase block">SpO2 (Altura)</span>
                <span className="text-sm font-bold font-mono text-on-surface">{patient.vitals.spo2}</span>
              </div>
              <div className="p-2.5 bg-surface border border-surface-container-high text-center">
                <span className="text-[10px] text-on-surface-variant font-mono uppercase block">Frec. Resp.</span>
                <span className="text-sm font-bold font-mono text-on-surface">{patient.vitals.fr}</span>
              </div>
              <div className="p-2.5 bg-surface border border-surface-container-high text-center">
                <span className="text-[10px] text-on-surface-variant font-mono uppercase block">Glucosa</span>
                <span className="text-sm font-bold font-mono text-on-surface">{patient.vitals.gluc}</span>
              </div>
            </div>

            {(patient.vitals.peso || patient.vitals.talla || patient.vitals.imc) && (
              <div className="flex flex-wrap items-center gap-4 mt-2.5 pt-2 border-t border-surface-container-high text-[11px] text-on-surface-variant">
                {patient.vitals.peso && <div><strong>Peso:</strong> {patient.vitals.peso}</div>}
                {patient.vitals.talla && <div><strong>Talla:</strong> {patient.vitals.talla}</div>}
                {patient.vitals.imc && <div><strong>IMC:</strong> {patient.vitals.imc}</div>}
              </div>
            )}
          </div>

          {/* Clinical Destination & Doctor */}
          <div className="p-3.5 bg-primary-container/20 border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-primary">
                Destino Clínico Asignado
              </div>
              <div className="text-sm font-black text-on-surface mt-0.5">{patient.destino}</div>
              <div className="text-xs text-on-surface-variant mt-0.5">
                <strong>Médico Responsable:</strong> {patient.medico}
              </div>
            </div>
            <span className="px-3 py-1 bg-surface text-primary border border-primary/30 text-xs font-bold self-start sm:self-auto">
              Box Activo
            </span>
          </div>

          {/* Medical Prescription in Campaign */}
          {patient.receta && patient.receta.length > 0 && (
            <div className="p-3.5 bg-surface-container-low border border-dashed border-surface-container-high">
              <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">prescriptions</span>
                Receta Médica en Campaña Prescrita
              </div>
              <ul className="space-y-1">
                {patient.receta.map((rx, idx) => (
                  <li key={idx} className="text-xs font-mono text-on-surface flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{rx}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadata & Hash */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-container-high text-[10px] text-on-surface-variant font-mono">
            <span>HASH P2P: {patient.hash ?? '8f92-a1b4-7c3e-90df'} • DESCONECTADO</span>
            <span>Fecha Emisión: {patient.fecha ?? '19/09/2026'}</span>
          </div>
        </div>

        {/* Modal Footer Quick Actions */}
        <div className="p-4 bg-surface-container border-t border-surface-container-high flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface text-on-surface hover:bg-surface-container-high text-xs font-bold uppercase tracking-wider border border-surface-container-high cursor-pointer transition-colors"
          >
            Cerrar Ficha
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/triaje')
              }}
              className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-surface-container-high cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">vital_signs</span>
              <span>Triaje</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/consulta')
              }}
              className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-surface-container-high cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">stethoscope</span>
              <span>Consulta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/tickets')
              }}
              className="px-4 py-2 bg-primary text-on-primary hover:bg-on-primary-fixed-variant text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Ver / Emitir Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
