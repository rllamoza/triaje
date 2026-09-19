import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Navbar } from './Navbar'
import { useNodeStatus } from '../../api/hooks'

interface AppLayoutProps {
  requiredRoles?: string[]
}

export function AppLayout({ requiredRoles }: AppLayoutProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  const { data: nodeStatus } = useNodeStatus()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  const campLinks = [
    { path: '/admision', label: 'Registro de Pacientes', icon: 'person_add' },
    { path: '/triaje', label: 'Triaje Clínico', icon: 'vital_signs' },
    { path: '/queue', label: 'Cola de Espera Médica', icon: 'hourglass_empty' },
    { path: '/consulta', label: 'Consulta Médica', icon: 'clinical_notes' },
    { path: '/tickets', label: 'Ticket Térmico', icon: 'receipt_long' },
  ]

  const adminLinks = [
    { path: '/admin/personalizacion', label: 'Personalización & Logos', icon: 'palette' },
    { path: '/admin/usuarios', label: 'Gestión de Usuarios', icon: 'manage_accounts' },
    { path: '/admin/telemetria', label: 'Integraciones (API & Webhooks)', icon: 'hub' },
  ]

  return (
    <div className="min-h-screen bg-surface-container-low font-body text-on-surface antialiased">
      {/* Top Fixed Navbar (h-16) */}
      <Navbar />

      {/* Fixed Sidebar (Carbon Aside) */}
      <aside className="fixed left-0 top-16 bottom-0 w-72 bg-surface z-40 shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between overflow-y-auto border-r border-surface-container-high hidden lg:flex">
        <div className="py-3">
          <div className="px-4 pb-2.5 text-[13px] font-bold uppercase tracking-wider text-on-surface-variant">
            Operaciones de Campaña
          </div>
          <nav className="space-y-1 px-2.5">
            {campLinks.map((item) => {
              const isActive = location.pathname === item.path || (item.path === '/queue' && location.pathname === '/cola')
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3.5 py-2.5 text-[14px] transition-colors rounded-none ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-[21px] mr-3.5 text-primary">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="px-4 pt-6 pb-2.5 text-[13px] font-bold uppercase tracking-wider text-on-surface-variant">
            Administración
          </div>
          <nav className="space-y-1 px-2.5">
            {adminLinks.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3.5 py-2.5 text-[14px] transition-colors rounded-none ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-[21px] mr-3.5 text-primary">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Terminal Local Status Box */}
        <div className="p-3.5 bg-surface-container-low m-2.5 border border-surface-container-high">
          <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
            <span className="font-bold uppercase tracking-wider text-[11.5px]">Terminal Local</span>
            <span className="text-tertiary font-bold flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" /> Activo
            </span>
          </div>
          <div className="text-[13px] font-mono text-on-surface-variant truncate">
            Nodo: {nodeStatus?.node_id ?? 'CUS-VALLE-04'}
          </div>
        </div>
      </aside>

      {/* Main Workspace (matching pl-72 and pt-16) */}
      <div className="lg:pl-72">
        <main className="w-full pt-16 px-4 sm:px-6 lg:px-8 min-h-screen bg-surface-container-low text-on-surface">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
