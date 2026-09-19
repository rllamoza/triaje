import { useState } from 'react'
import { useUsers, useStoreUser } from '../../api/hooks'

interface StaffUser {
  id: number
  nombres: string
  apellidos: string
  full_name: string
  email: string
  role: string
  cmp_code?: string
  dni: string
  station: string
  active: boolean
  dnie: boolean
}

const mockStaff: StaffUser[] = [
  {
    id: 1,
    nombres: 'Marco',
    apellidos: 'Huamán Quispe',
    full_name: 'Dr. Marco Huamán Quispe',
    email: 'mhuaman@semilla.pe',
    role: 'medico',
    cmp_code: 'CMP-89241',
    dni: '42918204',
    station: 'Consultorio 1 - Med. General',
    active: true,
    dnie: true,
  },
  {
    id: 2,
    nombres: 'Sara',
    apellidos: 'Benavides Tapia',
    full_name: 'Lic. Sara Benavides Tapia',
    email: 'sbenavides@semilla.pe',
    role: 'triaje',
    cmp_code: 'CEP-44912',
    dni: '29481092',
    station: 'Triaje Box 1 - Somatometría',
    active: true,
    dnie: true,
  },
  {
    id: 3,
    nombres: 'Alejandro',
    apellidos: 'Torres Valencia',
    full_name: 'Alejandro Torres Valencia',
    email: 'atorres@semilla.pe',
    role: 'admision',
    dni: '71928401',
    station: 'Mesa Admisión & Filiación',
    active: true,
    dnie: true,
  },
  {
    id: 4,
    nombres: 'Rosa María',
    apellidos: 'Ramos Morales',
    full_name: 'Dra. Rosa María Ramos Morales',
    email: 'rramos@semilla.pe',
    role: 'medico',
    cmp_code: 'CMP-76492',
    dni: '10928472',
    station: 'Consultorio 2 - Pediatría',
    active: true,
    dnie: true,
  },
  {
    id: 5,
    nombres: 'Katia',
    apellidos: 'Quispe Vilca',
    full_name: 'Lic. Katia Quispe Vilca',
    email: 'kquispe@semilla.pe',
    role: 'triaje',
    cmp_code: 'CEP-58190',
    dni: '43920194',
    station: 'Triaje Box 2 - Urgencias',
    active: true,
    dnie: false,
  },
  {
    id: 6,
    nombres: 'Administrador',
    apellidos: 'Semilla General',
    full_name: 'Administrador Semilla General',
    email: 'admin@semilla.pe',
    role: 'admin',
    cmp_code: 'ADMIN-001',
    dni: '00000001',
    station: 'Centro de Operaciones (NOC)',
    active: true,
    dnie: true,
  },
]

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  // New user form state
  const [newName, setNewName] = useState('')
  const [newApellidos, setNewApellidos] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('medico')
  const [newCmp, setNewCmp] = useState('')
  const [newDni, setNewDni] = useState('')
  const [newPin, setNewPin] = useState('4582')
  const [modalMessage, setModalMessage] = useState<string | null>(null)

  const { data: apiUsers } = useUsers()
  const createUser = useStoreUser()

  const staffList = (apiUsers && apiUsers.length > 0 ? apiUsers.map(u => ({
    id: u.id,
    nombres: u.nombres || 'Usuario',
    apellidos: u.apellidos || '',
    full_name: u.full_name || `${u.nombres || ''} ${u.apellidos || ''}`.trim(),
    email: u.nombres ? `${u.nombres.toLowerCase().slice(0,1)}${(u.apellidos || 'usuario').toLowerCase().split(' ')[0]}@semilla.pe` : 'usuario@semilla.pe',
    role: u.role || 'medico',
    cmp_code: u.cmp_code ?? undefined,
    dni: u.dni ?? '00000000',
    station: u.station_default ?? 'Box General',
    active: u.active ?? true,
    dnie: true,
  })) : mockStaff).filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.dni.includes(q) ||
        (u.cmp_code && u.cmp_code.toLowerCase().includes(q))
      )
    }
    return true
  })

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalMessage(null)
    try {
      await createUser.mutateAsync({
        nombres: newName,
        apellidos: newApellidos,
        email: newEmail,
        password: 'Password2025!',
        role: newRole as 'admin' | 'medico' | 'triaje' | 'admision' | 'guardia',
        cmp_code: newCmp || undefined,
        dni: newDni || undefined,
        pin_code: newPin,
      })
      setModalMessage('¡Usuario registrado con éxito!')
      setTimeout(() => {
        setShowModal(false)
        setModalMessage(null)
      }, 1500)
    } catch {
      setModalMessage('Error al crear usuario. Compruebe los campos.')
    }
  }

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Header Contextual Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-primary-container text-on-primary-fixed">
              ADM-07
            </span>
            <span className="px-2 py-0.5 text-[11px] font-medium bg-surface-container text-on-surface-variant flex items-center gap-1.5 border border-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              Directorio de Personal Clínico en Campaña
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-on-surface">
            Gestión de Usuarios <span className="font-semibold text-primary">&amp; Turnos en Terreno</span>
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-none shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>+ Nuevo Usuario / Voluntario</span>
        </button>
      </div>

      {/* Operational Summary Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-surface p-4 border border-surface-container-high shadow-xs">
          <div className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
            Personal Activo en Terreno
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-light text-on-surface font-mono">{mockStaff.length}</span>
            <span className="text-xs text-tertiary font-medium">100% Presentes</span>
          </div>
          <div className="mt-2 h-1 w-full bg-surface-container">
            <div className="h-1 bg-tertiary w-full" />
          </div>
        </div>

        <div className="bg-surface p-4 border border-surface-container-high shadow-xs">
          <div className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
            Médicos Evaluadores
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-light text-primary font-mono">2</span>
            <span className="text-xs text-secondary font-mono">Boxes activos</span>
          </div>
          <div className="mt-2 h-1 w-full bg-surface-container">
            <div className="h-1 bg-primary w-full" />
          </div>
        </div>

        <div className="bg-surface p-4 border border-surface-container-high shadow-xs">
          <div className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
            Enfermería &amp; Triaje
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-light text-[#b28600] font-mono">2</span>
            <span className="text-xs text-secondary font-mono">Puestos de somatometría</span>
          </div>
          <div className="mt-2 h-1 w-full bg-surface-container">
            <div className="h-1 bg-[#f1c21b] w-full" />
          </div>
        </div>

        <div className="bg-surface p-4 border border-surface-container-high shadow-xs">
          <div className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
            Admisión &amp; Empadronamiento
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-light text-on-surface font-mono">1</span>
            <span className="text-xs text-tertiary font-medium">Lector DNIe listo</span>
          </div>
          <div className="mt-2 h-1 w-full bg-surface-container">
            <div className="h-1 bg-tertiary w-full" />
          </div>
        </div>
      </div>

      {/* Granular Permission Matrix Section (from 08_modulo7_gestion_usuarios_carbon.html) */}
      <section className="bg-surface-container-low p-6 border border-surface-container-high shadow-xs mt-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-container-high">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">security</span>
              <h2 className="text-base font-semibold text-on-surface uppercase tracking-wider">
                Matriz Granular de Privilegios de Seguridad
              </h2>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Definición estricta de capacidades delegadas por rol para operaciones clínicas y técnicas sin conexión a internet.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="inline-flex bg-surface p-1 border border-surface-container-high">
            {[
              { id: 'medico', label: 'Médico' },
              { id: 'triaje', label: 'Triaje' },
              { id: 'admision', label: 'Admisión' },
              { id: 'farmacia', label: 'Farmacia' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setRoleFilter(t.id)}
                className={`px-4.5 py-2 text-[13.5px] font-bold transition-colors cursor-pointer rounded-none ${
                  roleFilter === t.id
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Table */}
        <div className="bg-surface overflow-x-auto border border-surface-container-high mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant border-b border-surface-container-high">
                <th className="py-3 px-4 w-1/2">Privilegio / Operación Crítica</th>
                <th className="py-3 px-4 w-1/6 text-center">Permiso Activo</th>
                <th className="py-3 px-4 w-1/3">Nivel de Autenticación Requerido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high text-on-surface">
              <tr className="bg-surface">
                <td className="py-3.5 px-4 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">clinical_notes</span>
                    <span>Acceso a Historia Clínica Completa y Antecedentes</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <input defaultChecked type="checkbox" className="w-4 h-4 text-primary accent-primary rounded-none" />
                </td>
                <td className="py-3.5 px-4 text-on-surface-variant font-mono text-[11px]">
                  DNIe / Certificado RENIEC en Token
                </td>
              </tr>
              <tr className="bg-surface-container-low/40">
                <td className="py-3.5 px-4 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">medication</span>
                    <span>Prescripción de Fármacos Controlados y Receta Digital</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <input defaultChecked={roleFilter === 'medico'} type="checkbox" className="w-4 h-4 text-primary accent-primary rounded-none" />
                </td>
                <td className="py-3.5 px-4 text-on-surface-variant font-mono text-[11px]">
                  Firma Digital CMP Habilitada
                </td>
              </tr>
              <tr className="bg-surface">
                <td className="py-3.5 px-4 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">cancel_presentation</span>
                    <span>Anulación de Tickets y Reasignación de Turnos</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <input defaultChecked={roleFilter === 'triaje' || roleFilter === 'admision'} type="checkbox" className="w-4 h-4 text-primary accent-primary rounded-none" />
                </td>
                <td className="py-3.5 px-4 text-on-surface-variant font-mono text-[11px]">
                  PIN Supervisor de Campo
                </td>
              </tr>
              <tr className="bg-surface-container-low/40">
                <td className="py-3.5 px-4 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">cloud_sync</span>
                    <span>Exportación de Base de Datos P2P / Volcado USB Cifrado</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <input type="checkbox" className="w-4 h-4 text-primary accent-primary rounded-none" />
                </td>
                <td className="py-3.5 px-4 text-on-surface-variant font-mono text-[11px]">
                  Llave FIDO2 de Telecomunicaciones
                </td>
              </tr>
              <tr className="bg-surface">
                <td className="py-3.5 px-4 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">print</span>
                    <span>Configuración de Impresora Térmica y Nodos Mesh</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <input defaultChecked type="checkbox" className="w-4 h-4 text-primary accent-primary rounded-none" />
                </td>
                <td className="py-3.5 px-4 text-on-surface-variant font-mono text-[11px]">
                  Contraseña de Infraestructura
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footnote Actions */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
          <span className="text-xs text-on-surface-variant font-mono">
            Última sincronización de perfil aplicada por: <strong>SuperAdmin (hace 45 min)</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-surface text-on-surface hover:bg-surface-container border border-surface-container-high text-xs font-semibold transition-colors cursor-pointer rounded-none"
            >
              Restablecer Predeterminados
            </button>
            <button
              type="button"
              onClick={() => alert('Cambios de perfil de seguridad guardados')}
              className="px-4 py-2 bg-primary text-on-primary hover:bg-on-primary-fixed-variant text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer rounded-none shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              Guardar Cambios de Perfil
            </button>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-3 mb-4 border border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, CMP o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-surface-container-low text-xs text-on-surface border border-surface-container-high focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 bg-surface-container-low text-xs text-on-surface px-3 pr-8 border border-surface-container-high appearance-none cursor-pointer font-medium focus:outline-none"
            >
              <option value="all">Todos los Roles</option>
              <option value="medico">Médicos</option>
              <option value="triaje">Enfermería Triaje</option>
              <option value="admision">Admisión</option>
              <option value="admin">Administrador</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-2 pointer-events-none text-secondary text-[16px]">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Carbon Data Table: User Roster */}
      <div className="bg-surface border border-surface-container-high shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-surface-container text-on-surface-variant uppercase text-[11px] tracking-wider font-semibold border-b border-surface-container-high">
            <tr>
              <th className="py-3 px-4">Usuario / Profesional</th>
              <th className="py-3 px-4">Rol y Colegiatura</th>
              <th className="py-3 px-4">Puesto Asignado</th>
              <th className="py-3 px-4">Estado en Terreno</th>
              <th className="py-3 px-4">Autenticación DNIe</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high text-on-surface">
            {staffList.map((u) => {
              const initials = `${u.nombres[0]}${u.apellidos[0]}`
              return (
                <tr key={u.id} className="hover:bg-surface-container transition-colors bg-surface">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">{u.full_name}</span>
                        <span className="text-[11px] text-secondary font-mono">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold capitalize text-on-surface">
                        {u.role === 'admin' ? 'Administrador' : u.role === 'medico' ? 'Médico General' : u.role === 'triaje' ? 'Enfermería' : 'Admisión'}
                      </span>
                      <span className="text-[11px] font-mono text-primary font-bold">
                        {u.cmp_code ?? `DNI: ${u.dni}`}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-surface-container px-2 py-1 font-mono text-[11px] text-on-surface border border-surface-container-high">
                      {u.station}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase bg-tertiary-container text-on-tertiary-container">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                      Activo / De Turno
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 text-xs text-tertiary font-mono font-medium">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>DNIe Token OK</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      className="p-1 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                      title="Editar usuario"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: New User */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-container-high max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <h3 className="text-base font-semibold text-on-surface uppercase tracking-wider">
                Alta de Personal Clínico / Voluntario
              </h3>
              <button onClick={() => setShowModal(false)} className="text-secondary hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {modalMessage && (
              <div className="p-3 bg-tertiary-container text-on-tertiary-container text-xs font-semibold">
                {modalMessage}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-on-surface-variant mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full h-9 px-3 bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-on-surface-variant mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={newApellidos}
                    onChange={(e) => setNewApellidos(e.target.value)}
                    className="w-full h-9 px-3 bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-on-surface-variant mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full h-9 px-3 bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-on-surface-variant mb-1">Rol Operativo *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full h-9 px-3 bg-surface-container-low border border-surface-container-high focus:outline-none"
                  >
                    <option value="medico">Médico Evaluador</option>
                    <option value="triaje">Enfermería Triaje</option>
                    <option value="admision">Admisión / Filiación</option>
                    <option value="admin">Administrador General</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold uppercase text-on-surface-variant mb-1">Colegiatura / CMP</label>
                  <input
                    type="text"
                    placeholder="Ej. CMP-84920"
                    value={newCmp}
                    onChange={(e) => setNewCmp(e.target.value)}
                    className="w-full h-9 px-3 bg-surface-container-low border border-surface-container-high focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-on-surface-variant mb-1">DNI *</label>
                  <input
                    type="text"
                    maxLength={8}
                    required
                    value={newDni}
                    onChange={(e) => setNewDni(e.target.value)}
                    className="w-full h-9 px-3 bg-surface-container-low border border-surface-container-high focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-on-surface-variant mb-1">PIN de Contingencia (4 dígitos)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full h-9 px-3 bg-surface-container-low border border-surface-container-high focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-surface-container uppercase font-semibold text-xs rounded-none cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary uppercase font-semibold text-xs rounded-none cursor-pointer hover:bg-on-primary-fixed-variant"
                >
                  Guardar Profesional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
