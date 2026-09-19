import { useState } from 'react'
import { useStoreConsulta } from '../../api/hooks'

export default function ConsultaPage() {
  const [activeTab, setActiveTab] = useState<'clinica' | 'receta' | 'cierre'>('clinica')

  // Clinical data
  const [anamnesis, setAnamnesis] = useState('Paciente varón de 54 años refiere dolor lumbar agudo e incapacitante de 4 días de evolución, posterior a esfuerzo físico en faena comunal. Se acompaña de cefalea frontal opresiva y sensación febril no cuantificada.')
  const [examenFisico, setExamenFisico] = useState('BEG, BEH, febril al tacto. CV: Ruidos cardíacos rítmicos sin soplos. Tórax y Pulmones: Murmullo vesicular pasa bien en ambos hemitórax, sin estertores. Columna: Dolor exquisito a la palpación de paravertebrales lumbares L4-S1. Lasègue negativo bilateral.')
  const [diagnosticos, setDiagnosticos] = useState([
    { cie10: 'M54.5', descripcion: 'Lumbago no especificado', tipo: 'definitivo' },
    { cie10: 'I10', descripcion: 'Hipertensión esencial (primaria)', tipo: 'presuntivo' },
    { cie10: 'R50.9', descripcion: 'Fiebre no especificada', tipo: 'presuntivo' },
  ])
  const [nuevoCie, setNuevoCie] = useState('')
  const [nuevoDesc, setNuevoDesc] = useState('')

  // Prescription items
  const [recetas, setRecetas] = useState([
    { med: 'Paracetamol 500 mg', dosis: '1 tableta', frec: 'Cada 8 horas', duracion: '3 días', via: 'Oral', indicacion: 'Tomar con abundante agua después de los alimentos.' },
    { med: 'Naproxeno 550 mg', dosis: '1 tableta', frec: 'Cada 12 horas', duracion: '4 días', via: 'Oral', indicacion: 'Para el dolor lumbar intenso.' },
  ])
  const [medInput, setMedInput] = useState('')
  const [dosisInput, setDosisInput] = useState('')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const createConsulta = useStoreConsulta()

  const handleAddDx = () => {
    if (!nuevoCie || !nuevoDesc) return
    setDiagnosticos([...diagnosticos, { cie10: nuevoCie, descripcion: nuevoDesc, tipo: 'definitivo' }])
    setNuevoCie('')
    setNuevoDesc('')
  }

  const handleAddMed = () => {
    if (!medInput) return
    setRecetas([...recetas, { med: medInput, dosis: dosisInput || '1 dosis', frec: 'Cada 8 horas', duracion: '3 días', via: 'Oral', indicacion: 'Uso oral' }])
    setMedInput('')
    setDosisInput('')
  }

  const handleFinalize = async () => {
    setMessage(null)
    setSaving(true)
    try {
      await createConsulta.mutateAsync({
        atencion_id: 1,
        anamnesis,
        examen_fisico: examenFisico,
        diagnosticos: diagnosticos.map((d) => ({
          cie10_codigo: d.cie10,
          cie10_descripcion: d.descripcion,
          tipo: d.tipo as 'presuntivo' | 'definitivo' | 'repetido',
        })),
        recetas: recetas.map((r) => ({
          medicamento_nombre: r.med,
          dosis: r.dosis,
          frecuencia: r.frec,
          duracion_dias: 3,
          via: r.via,
          indicaciones: r.indicacion,
        })),
        indicaciones_generales: 'Reposo relativo 48 horas. Hidratación oral adecuada.',
      })

      setMessage({
        text: '¡Consulta médica finalizada con éxito! Historia firmada digitalmente y ticket de farmacia despachado.',
        type: 'success',
      })
    } catch {
      setMessage({
        text: 'Error al registrar consulta médica. Verifique la conexión local.',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Top Clinical Context Bar */}
      <section className="bg-surface shadow-xs border border-surface-container-high mb-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 bg-primary-container text-primary flex items-center justify-center font-mono font-bold text-xl border border-primary/20 shrink-0">
              T-104
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-on-surface truncate">
                  Juan Quispe Condori
                </h1>
                <span className="text-xs text-on-surface-variant font-mono bg-surface-container px-2 py-0.5 border border-surface-container-high">
                  54 años • DNI 42918274
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-[#f1c21b] text-[#161616]">
                  <span className="w-2 h-2 bg-[#b28600] shrink-0" />
                  Prioridad II • Urgencia Moderada
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-on-surface-variant mt-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">location_on</span>
                  Ollantaytambo Sector Alto
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">timer</span>
                  Espera en carpa: <strong className="text-on-surface font-mono">28 min</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">badge</span>
                  Triaje: Lic. K. Quispe (08:42 hrs)
                </span>
              </div>
            </div>
          </div>

          {/* Severe Allergy Alert Banner */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-error-container text-on-error-container px-3.5 py-2 border border-error/30">
              <span className="material-symbols-outlined text-error text-[22px]">warning</span>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-widest block text-error leading-none">
                  Alerta Médica de Seguridad
                </span>
                <span className="text-xs font-bold leading-tight">
                  ALERGIA SEVERA: PENICILINAS / BETALACTÁMICOS
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Clinical Split Layout */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Panel: Vitals & History (Col 1-5) */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Ficha de Constantes Vitales */}
          <div className="bg-surface p-5 shadow-xs border border-surface-container-high">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-container-high">
              <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-[16px]">vital_signs</span>
                Signos Vitales de Triaje
              </div>
              <span className="text-[11px] font-mono text-secondary">08:42 hrs</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-surface-container border border-surface-container-high">
                <span className="text-[10px] uppercase text-secondary font-semibold block">Presión Arterial</span>
                <div className="text-base font-mono font-bold text-on-surface mt-0.5">145/95 mmHg</div>
                <span className="text-[10px] text-[#b28600] font-bold">Prehipertensión II</span>
              </div>

              <div className="p-2.5 bg-surface-container border border-surface-container-high">
                <span className="text-[10px] uppercase text-secondary font-semibold block">Frec. Cardíaca</span>
                <div className="text-base font-mono font-bold text-on-surface mt-0.5">88 lpm</div>
                <span className="text-[10px] text-tertiary font-semibold">Normocárdico</span>
              </div>

              <div className="p-2.5 bg-surface-container border border-surface-container-high">
                <span className="text-[10px] uppercase text-secondary font-semibold block">Temperatura</span>
                <div className="text-base font-mono font-bold text-error mt-0.5">38.6 °C</div>
                <span className="text-[10px] text-error font-bold">Febril</span>
              </div>

              <div className="p-2.5 bg-surface-container border border-surface-container-high">
                <span className="text-[10px] uppercase text-secondary font-semibold block">SpO2 (2,792m)</span>
                <div className="text-base font-mono font-bold text-[#b28600] mt-0.5">92 %</div>
                <span className="text-[10px] text-tertiary font-semibold">Compensado Altura</span>
              </div>

              <div className="p-2.5 bg-surface-container border border-surface-container-high">
                <span className="text-[10px] uppercase text-secondary font-semibold block">Frec. Respiratoria</span>
                <div className="text-base font-mono font-bold text-on-surface mt-0.5">20 rpm</div>
                <span className="text-[10px] text-tertiary font-semibold">Eupneico</span>
              </div>

              <div className="p-2.5 bg-surface-container border border-surface-container-high">
                <span className="text-[10px] uppercase text-secondary font-semibold block">Somatometría</span>
                <div className="text-base font-mono font-bold text-on-surface mt-0.5">68.5 kg / 1.62m</div>
                <span className="text-[10px] text-secondary font-mono">IMC: 26.1 (Sobrepeso)</span>
              </div>
            </div>
          </div>

          {/* Factores de Riesgo Crónico */}
          <div className="bg-surface p-5 shadow-xs border border-surface-container-high">
            <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1">
              <span className="material-symbols-outlined text-primary text-[16px]">history</span>
              Factores de Riesgo &amp; Antecedentes
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 bg-surface-container border border-surface-container-high flex items-center justify-between">
                <span>Hipertensión Arterial Diagnosticada</span>
                <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container font-mono text-[10px] font-bold">
                  Tratamiento Enalapril
                </span>
              </div>
              <div className="p-2 bg-surface-container border border-surface-container-high flex items-center justify-between">
                <span>Exposición Humo de Leña (Cocina)</span>
                <span className="text-secondary font-mono text-[10px]">30+ años</span>
              </div>
              <div className="p-2 bg-error-container text-on-error-container border border-error/30 font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-[16px]">dangerous</span>
                <span>Shock anafiláctico con Penicilina G</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Anamnesis, CIE-10, Prescripción & Firma (Col 6-12) */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* Tabs */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high">
            <div className="flex bg-surface-container p-1 gap-1 border border-surface-container-high mb-5">
              <button
                type="button"
                onClick={() => setActiveTab('clinica')}
                className={`flex-1 py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer rounded-none ${
                  activeTab === 'clinica'
                    ? 'bg-surface text-on-surface border border-surface-container-high shadow-xs'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-primary">clinical_notes</span>
                Atención Clínica &amp; CIE-10
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('receta')}
                className={`flex-1 py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer rounded-none ${
                  activeTab === 'receta'
                    ? 'bg-surface text-on-surface border border-surface-container-high shadow-xs'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-primary">medication</span>
                Prescripción &amp; Receta ({recetas.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cierre')}
                className={`flex-1 py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer rounded-none ${
                  activeTab === 'cierre'
                    ? 'bg-surface text-on-surface border border-surface-container-high shadow-xs'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                Firma Digital &amp; Cierre
              </button>
            </div>

            {/* TAB 1: Clinica & CIE-10 */}
            {activeTab === 'clinica' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Anamnesis / Historia de la Enfermedad Actual
                  </label>
                  <textarea
                    rows={3}
                    value={anamnesis}
                    onChange={(e) => setAnamnesis(e.target.value)}
                    className="w-full p-3 bg-surface-container-low text-xs text-on-surface border border-surface-container-high focus:border-primary focus:bg-surface focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Examen Físico Dirigido por Sistemas
                  </label>
                  <textarea
                    rows={3}
                    value={examenFisico}
                    onChange={(e) => setExamenFisico(e.target.value)}
                    className="w-full p-3 bg-surface-container-low text-xs text-on-surface border border-surface-container-high focus:border-primary focus:bg-surface focus:outline-none"
                  />
                </div>

                {/* Diagnósticos CIE-10 */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Diagnósticos CIE-10 Registrados
                  </label>

                  <div className="space-y-2 mb-3">
                    {diagnosticos.map((d, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 bg-surface-container border border-surface-container-high text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-primary-container text-on-primary-fixed font-mono font-bold text-[11px]">
                            {d.cie10}
                          </span>
                          <span className="font-semibold text-on-surface">{d.descripcion}</span>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-semibold bg-surface-container-highest">
                          {d.tipo}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add CIE-10 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Código (Ej. K29.7)"
                      value={nuevoCie}
                      onChange={(e) => setNuevoCie(e.target.value)}
                      className="w-28 h-9 px-2 bg-surface-container-low text-xs font-mono border border-surface-container-high focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Descripción del diagnóstico..."
                      value={nuevoDesc}
                      onChange={(e) => setNuevoDesc(e.target.value)}
                      className="flex-1 h-9 px-3 bg-surface-container-low text-xs border border-surface-container-high focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddDx}
                      className="px-3 bg-primary text-on-primary text-xs font-semibold uppercase hover:bg-on-primary-fixed-variant transition-colors cursor-pointer rounded-none"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Receta & Farmacia */}
            {activeTab === 'receta' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Prescripción Farmacológica en Campaña
                  </span>
                  <span className="text-[11px] text-tertiary font-mono font-bold">Botiquín en línea</span>
                </div>

                <div className="space-y-2.5">
                  {recetas.map((r, i) => (
                    <div
                      key={i}
                      className="p-3 bg-surface-container border border-surface-container-high text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-on-surface text-sm">{r.med}</span>
                        <span className="font-mono text-[11px] text-primary">{r.frec} x {r.duracion}</span>
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        Dosis: {r.dosis} • Vía: {r.via} • Indicación: {r.indicacion}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add med */}
                <div className="p-3 bg-surface-container-low border border-surface-container-high space-y-2">
                  <span className="text-[11px] font-semibold text-secondary uppercase block">
                    Prescribir Nuevo Fármaco
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre del medicamento (ej. Amoxicilina)"
                      value={medInput}
                      onChange={(e) => setMedInput(e.target.value)}
                      className="h-9 px-3 bg-surface text-xs border border-surface-container-high focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Dosis y frecuencia (ej. 1 comp c/8h)"
                      value={dosisInput}
                      onChange={(e) => setDosisInput(e.target.value)}
                      className="h-9 px-3 bg-surface text-xs border border-surface-container-high focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMed}
                    className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold uppercase hover:bg-on-primary-fixed-variant transition-colors cursor-pointer rounded-none"
                  >
                    + Agregar a Receta
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Cierre & Firma */}
            {activeTab === 'cierre' && (
              <div className="space-y-5 text-xs">
                <div className="p-4 bg-surface-container border border-surface-container-high space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-[20px]">verified</span>
                    <span>Certificación Médica Digital de Atención</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className="text-[10px] text-secondary uppercase block">Profesional:</span>
                      <span className="font-bold">Dr. Marco Huamán Quispe</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-secondary uppercase block">Colegiatura CMP:</span>
                      <span className="font-mono font-bold">CMP-89241</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-secondary uppercase block">Especialidad:</span>
                      <span>Medicina General y Comunitaria</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-secondary uppercase block">Token Criptográfico:</span>
                      <span className="font-mono text-tertiary">SHA256: 4f81-a9c2-local</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleFinalize}
                  className="w-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-semibold py-3.5 px-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer rounded-none"
                >
                  <span className="material-symbols-outlined text-base">task_alt</span>
                  <span>{saving ? 'Guardando e Imprimiendo...' : 'Finalizar Consulta & Emitir Receta'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
