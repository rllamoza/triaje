import { useState } from 'react'
import {
  useCampaigns,
  useStoreCampaign,
  useUpdateCampaign,
  useActivateCampaign,
  useMedicos,
} from '../../api/hooks'
import type { Campaign } from '../../api/hooks'
import api from '../../api/client'

const DEFAULT_SPECIALTIES: Array<{
  specialty_code: string
  specialty_name: string
  medico_id: number | null
  consultorio: string
  cupo_maximo: number
}> = [
  { specialty_code: 'MED', specialty_name: 'Medicina General', medico_id: null, consultorio: 'Consultorio 01', cupo_maximo: 30 },
  { specialty_code: 'PED', specialty_name: 'Pediatría', medico_id: null, consultorio: 'Consultorio 02', cupo_maximo: 20 },
  { specialty_code: 'ODO', specialty_name: 'Odontología', medico_id: null, consultorio: 'Box Dental', cupo_maximo: 15 },
  { specialty_code: 'GIN', specialty_name: 'Ginecología', medico_id: null, consultorio: 'Tópico Ginec.', cupo_maximo: 15 },
  { specialty_code: 'OFT', specialty_name: 'Oftalmología', medico_id: null, consultorio: 'Módulo Visual', cupo_maximo: 20 },
]

export default function CampanasPage() {
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

  // Form state
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [locationName, setLocationName] = useState('')
  const [province, setProvince] = useState('')
  const [department, setDepartment] = useState('')
  const [altitudeMasl, setAltitudeMasl] = useState<number | ''>(2800)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<'planned' | 'active' | 'closed'>('planned')
  const [specialties, setSpecialties] = useState<typeof DEFAULT_SPECIALTIES>(DEFAULT_SPECIALTIES)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const { data: campaigns = [], isLoading, refetch } = useCampaigns(filterStatus || undefined)
  const { data: medicos = [] } = useMedicos()
  const createCampaign = useStoreCampaign()
  const updateCampaign = useUpdateCampaign()
  const activateCampaign = useActivateCampaign()

  const openCreateModal = () => {
    setEditingCampaign(null)
    setCode(`CUS-${Math.floor(10 + Math.random() * 90)}`)
    setName('')
    setLocationName('')
    setProvince('Urubamba')
    setDepartment('Cusco')
    setAltitudeMasl(2870)
    setStartDate(new Date().toISOString().split('T')[0])
    setEndDate('')
    setStatus('planned')
    setSpecialties([...DEFAULT_SPECIALTIES])
    setModalOpen(true)
  }

  const openEditModal = async (camp: Campaign) => {
    setEditingCampaign(camp)
    setCode(camp.code)
    setName(camp.name)
    setLocationName(camp.location_name)
    setProvince(camp.province || '')
    setDepartment(camp.department || '')
    setAltitudeMasl(camp.altitude_masl ?? '')
    setStartDate(camp.start_date ? camp.start_date.split('T')[0] : '')
    setEndDate(camp.end_date ? camp.end_date.split('T')[0] : '')
    setStatus(camp.status)
    setModalOpen(true)

    try {
      const res = await api.get(`/campaigns/${camp.id}/specialties`)
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSpecialties(res.data.map((s: any) => ({
          specialty_code: s.specialty_code,
          specialty_name: s.specialty_name,
          medico_id: s.medico_id ? Number(s.medico_id) : null,
          consultorio: s.consultorio || 'Consultorio 01',
          cupo_maximo: Number(s.cupo_maximo) || 30,
        })))
      } else {
        setSpecialties([...DEFAULT_SPECIALTIES])
      }
    } catch {
      setSpecialties([...DEFAULT_SPECIALTIES])
    }
  }


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      if (editingCampaign) {
        await updateCampaign.mutateAsync({
          id: editingCampaign.id,
          name,
          location_name: locationName,
          province,
          department,
          altitude_masl: altitudeMasl === '' ? null : Number(altitudeMasl),
          start_date: startDate,
          end_date: endDate || null,
          status,
          specialties,
        })
        setMessage({ text: 'Campaña y especialidades actualizadas exitosamente.', type: 'success' })
      } else {
        await createCampaign.mutateAsync({
          code,
          name,
          location_name: locationName,
          province,
          department,
          altitude_masl: altitudeMasl === '' ? null : Number(altitudeMasl),
          start_date: startDate,
          end_date: endDate || null,
          status,
          specialties,
        })
        setMessage({ text: 'Nueva campaña con especialidades creada exitosamente.', type: 'success' })
      }
      setModalOpen(false)
      refetch()
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message
      setMessage({ text: `Error al guardar campaña: ${apiMsg}`, type: 'error' })
    }
  }


  const handleActivate = async (id: number, cName: string) => {
    if (!window.confirm(`¿Desea activar la campaña "${cName}" como la campaña operativa actual?`)) return
    try {
      await activateCampaign.mutateAsync(id)
      setMessage({ text: `Campaña "${cName}" activada como operativa en todo el sistema.`, type: 'success' })
      refetch()
    } catch (err: any) {
      setMessage({ text: 'Error al activar campaña.', type: 'error' })
    }
  }

  const activeCount = campaigns.filter((c) => c.status === 'active').length
  const totalCount = campaigns.length

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-primary-container text-on-primary-fixed">
              ADMIN-02
            </span>
            <span className="px-2 py-0.5 text-[11px] font-medium bg-surface-container text-on-surface-variant flex items-center gap-1.5 border border-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              Gestión Integral de Misiones Médicas
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-on-surface">
            Gestión de <span className="font-semibold text-primary">Campañas de Salud</span>
          </h1>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="h-10 px-5 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-semibold uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer rounded-none self-start lg:self-auto transition-colors"
        >
          <span className="material-symbols-outlined text-base">add_location_alt</span>
          <span>Nueva Campaña</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 border text-xs font-medium flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-tertiary-container text-on-tertiary-container border-tertiary/40'
              : 'bg-error-container text-on-error-container border-error/40'
          }`}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="cursor-pointer font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface p-4 border border-surface-container-high shadow-xs">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-secondary">Total Campañas</div>
          <div className="text-2xl font-mono font-bold text-on-surface mt-1">{totalCount}</div>
        </div>
        <div className="bg-surface p-4 border border-surface-container-high shadow-xs">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-tertiary">Misión Activa en Campo</div>
          <div className="text-2xl font-mono font-bold text-tertiary mt-1">
            {activeCount > 0 ? `${activeCount} Activa` : 'Ninguna'}
          </div>
        </div>
        <div className="bg-surface p-4 border border-surface-container-high shadow-xs">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-secondary">Filtro Rápido</div>
          <div className="flex gap-1.5 mt-2">
            {[
              { id: '', label: 'Todas' },
              { id: 'active', label: 'Activas' },
              { id: 'planned', label: 'Planificadas' },
              { id: 'closed', label: 'Cerradas' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(f.id)}
                className={`px-2 py-0.5 text-[10px] font-mono border cursor-pointer ${
                  filterStatus === f.id
                    ? 'bg-primary text-on-primary border-primary font-bold'
                    : 'bg-surface-container text-on-surface border-surface-container-high'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List of Campaigns */}
      <div className="bg-surface border border-surface-container-high shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-container-high flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-on-surface">
            Campañas Registradas ({campaigns.length})
          </h2>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs text-secondary hover:text-primary flex items-center gap-1 cursor-pointer font-mono"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            <span>Actualizar</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-on-surface-variant font-mono">Cargando campañas...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-xs text-on-surface-variant">
            No se encontraron campañas con el filtro seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant border-b border-surface-container-high uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Código / Nombre</th>
                  <th className="py-3 px-4">Ubicación &amp; Altitud</th>
                  <th className="py-3 px-4">Fechas</th>
                  <th className="py-3 px-4 text-center">Atenciones Hoy</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {campaigns.map((camp) => {
                  const isActive = camp.status === 'active'
                  return (
                    <tr
                      key={camp.id}
                      className={`hover:bg-surface-container/50 transition-colors ${
                        isActive ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">{camp.code}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-tertiary-container text-on-tertiary-container">
                              OPERATIVA
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-on-surface text-sm mt-0.5">{camp.name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-on-surface font-medium">{camp.location_name}</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">
                          {camp.province ? `${camp.province}, ` : ''}{camp.department || ''}
                          {camp.altitude_masl ? ` • ${camp.altitude_masl} msnm` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div>Inicio: {camp.start_date ? new Date(camp.start_date).toLocaleDateString() : '—'}</div>
                        <div className="text-on-surface-variant">
                          Fin: {camp.end_date ? new Date(camp.end_date).toLocaleDateString() : 'Indefinido'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-sm">
                        {camp.today_count ?? 0}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-semibold uppercase ${
                            camp.status === 'active'
                              ? 'bg-tertiary-container text-on-tertiary-container'
                              : camp.status === 'planned'
                              ? 'bg-primary-container text-on-primary-container'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {camp.status === 'active' ? 'Activa' : camp.status === 'planned' ? 'Planeada' : 'Cerrada'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isActive && camp.status !== 'closed' && (
                            <button
                              type="button"
                              onClick={() => handleActivate(camp.id, camp.name)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-tertiary hover:bg-tertiary-container text-on-tertiary cursor-pointer transition-colors"
                              title="Activar como campaña actual del sistema"
                            >
                              Activar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(camp)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-on-surface cursor-pointer transition-colors"
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Crear / Editar Campaña */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-container-high shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 text-on-surface">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-surface-container-high">
              <h2 className="text-base font-bold uppercase tracking-wider text-on-surface">
                {editingCampaign ? `Editar Campaña: ${editingCampaign.code}` : 'Nueva Campaña de Salud'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCampaign}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high font-mono text-sm uppercase focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Nombre Descriptivo de Campaña *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Campaña Médica Valle Sagrado 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Localidad / Punto de Atención *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Puesto de Salud Ollantaytambo"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Altitud (msnm)
                  </label>
                  <input
                    type="number"
                    value={altitudeMasl}
                    onChange={(e) => setAltitudeMasl(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high text-sm font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-low border border-surface-container-high text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-2 bg-surface-container-low border border-surface-container-high text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-2 bg-surface-container-low border border-surface-container-high text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Estado Operativo
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full h-10 px-2 bg-surface-container-low border border-surface-container-high text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="planned">Planificada</option>
                    <option value="active">Activa Operativa</option>
                    <option value="closed">Cerrada / Finalizada</option>
                  </select>
                </div>
              </div>

              {/* Especialidades Médicas, Médicos y Cupos */}
              <div className="pt-4 border-t border-surface-container-high space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">medical_services</span>
                      <span>Especialidades Médicas, Médicos en Atención y Cupos</span>
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">
                      Indique qué médicos y en qué especialidades atenderán en esta campaña, con su consultorio y cupo máximo.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSpecialties([...DEFAULT_SPECIALTIES])}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-on-surface cursor-pointer flex items-center gap-1"
                      title="Cargar catálogo estándar: Medicina General, Pediatría, Odontología, Ginecología, Oftalmología"
                    >
                      <span className="material-symbols-outlined text-xs">restart_alt</span>
                      <span>Cargar Estándar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSpecialties([
                          ...specialties,
                          { specialty_code: 'ESP', specialty_name: 'Nueva Especialidad', medico_id: null, consultorio: 'Consultorio', cupo_maximo: 20 },
                        ])
                      }
                      className="px-2.5 py-1 text-[11px] font-semibold bg-primary hover:bg-on-primary-fixed-variant text-on-primary cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">add</span>
                      <span>+ Especialidad</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-surface-container-high bg-surface-container-lowest">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-surface-container-low text-[10px] font-mono text-on-surface-variant uppercase tracking-wider border-b border-surface-container-high">
                      <tr>
                        <th className="py-2 px-2.5 w-20">Código</th>
                        <th className="py-2 px-2.5">Especialidad Médica</th>
                        <th className="py-2 px-2.5">Médico Asignado</th>
                        <th className="py-2 px-2.5 w-32">Consultorio / Box</th>
                        <th className="py-2 px-2.5 w-24 text-center">Cupo Máx.</th>
                        <th className="py-2 px-2 text-center w-10">✕</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high">
                      {specialties.map((sp, idx) => (
                        <tr key={idx} className="hover:bg-surface-container-low/50">
                          <td className="p-1.5">
                            <input
                              type="text"
                              required
                              maxLength={5}
                              value={sp.specialty_code}
                              onChange={(e) => {
                                const next = [...specialties]
                                next[idx].specialty_code = e.target.value.toUpperCase()
                                setSpecialties(next)
                              }}
                              className="w-full px-2 py-1 text-xs font-mono font-bold uppercase bg-surface-container-low border border-surface-container-high text-on-surface focus:outline-none focus:border-primary text-center"
                              placeholder="MED"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              required
                              value={sp.specialty_name}
                              onChange={(e) => {
                                const next = [...specialties]
                                next[idx].specialty_name = e.target.value
                                setSpecialties(next)
                              }}
                              className="w-full px-2 py-1 text-xs bg-surface-container-low border border-surface-container-high text-on-surface focus:outline-none focus:border-primary"
                              placeholder="Ej. Medicina General"
                            />
                          </td>
                          <td className="p-1.5">
                            <select
                              value={sp.medico_id ?? ''}
                              onChange={(e) => {
                                const next = [...specialties]
                                next[idx].medico_id = e.target.value ? Number(e.target.value) : null
                                setSpecialties(next)
                              }}
                              className="w-full px-2 py-1 text-xs bg-surface-container-low border border-surface-container-high text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                            >
                              <option value="">(Sin médico fijo / Por asignar)</option>
                              {medicos.map((m) => (
                                <option key={m.id} value={m.id}>
                                  Dr. {m.name} {m.apellidos} {m.cmp_code ? `(${m.cmp_code})` : ''}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={sp.consultorio}
                              onChange={(e) => {
                                const next = [...specialties]
                                next[idx].consultorio = e.target.value
                                setSpecialties(next)
                              }}
                              className="w-full px-2 py-1 text-xs bg-surface-container-low border border-surface-container-high text-on-surface focus:outline-none focus:border-primary"
                              placeholder="Consultorio 01"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              min={1}
                              max={999}
                              required
                              value={sp.cupo_maximo}
                              onChange={(e) => {
                                const next = [...specialties]
                                next[idx].cupo_maximo = Math.max(1, Number(e.target.value) || 1)
                                setSpecialties(next)
                              }}
                              className="w-full px-2 py-1 text-xs font-mono font-bold text-center bg-surface-container-low border border-surface-container-high text-on-surface focus:outline-none focus:border-primary"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              disabled={specialties.length <= 1}
                              onClick={() => setSpecialties(specialties.filter((_, i) => i !== idx))}
                              className="text-on-surface-variant hover:text-rose-500 disabled:opacity-30 cursor-pointer text-sm font-bold"
                              title="Eliminar especialidad"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5 bg-surface-container-low p-2 border border-surface-container-high">
                  <span className="material-symbols-outlined text-sm text-primary">info</span>
                  <span>
                    Los turnos en Admisión se asignarán en formato correlativo de 4 dígitos (ej: <strong>MED-0001</strong>) y respetarán los cupos configurados.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container-high mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-on-surface text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-semibold uppercase tracking-wider shadow-xs cursor-pointer"
                >
                  {editingCampaign ? 'Guardar Cambios' : 'Crear Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

