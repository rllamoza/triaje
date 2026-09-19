import { useState, useEffect } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useBrandingStore } from '../../store/brandingStore'
import { Navbar } from './Navbar'
import { useNodeStatus, useLogout } from '../../api/hooks'

interface AppLayoutProps {
  requiredRoles?: string[]
}

export function AppLayout({ requiredRoles }: AppLayoutProps) {
  const { isAuthenticated, user, logout: logoutStore } = useAuthStore()
  const branding = useBrandingStore()
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: nodeStatus } = useNodeStatus()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile drawer whenever location changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

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

  const handleMobileLogout = async () => {
    setMobileMenuOpen(false)
    try {
      await logout.mutateAsync()
    } catch {}
    logoutStore()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface-container-low font-body text-on-surface antialiased">
      {/* Top Fixed Navbar (h-16) */}
      <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      {/* Desktop Fixed Sidebar (Carbon Aside - hidden on mobile) */}
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

      {/* Floating Action Button (FAB Hamburger - Mobile Only lg:hidden) */}
      <div className="fixed bottom-6 right-5 z-50 lg:hidden">
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          type="button"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
          title="Menú de Navegación de Campaña"
          className="w-14 h-14 bg-primary hover:bg-on-primary-fixed-variant text-on-primary rounded-full shadow-[0_6px_24px_rgba(15,98,254,0.45)] border-2 border-white flex items-center justify-center transition-all active:scale-95 cursor-pointer ring-4 ring-primary/20"
        >
          <span className="material-symbols-outlined text-[28px]">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-[85%] max-w-[320px] bg-surface h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto border-r border-surface-container-high animate-slide-in">
            {/* Drawer Header */}
            <div>
              <div className="p-4 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low">
                <div className="flex items-center gap-2.5 min-w-0">
                  {branding.logoUrl ? (
                    <img
                      alt={branding.appName}
                      className="h-8 w-auto max-w-[120px] object-contain"
                      src={branding.logoUrl}
                    />
                  ) : (
                    <div className="h-8 px-2 bg-primary text-on-primary text-xs font-bold flex items-center justify-center uppercase">
                      {branding.appName}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <div className="text-[14px] font-bold text-on-surface truncate">{branding.appName}</div>
                    <div className="text-[11px] text-on-surface-variant truncate uppercase">{branding.appTagline}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-none cursor-pointer"
                  aria-label="Cerrar menú"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              {/* User Profile Card */}
              <div className="p-4 bg-surface border-b border-surface-container-high">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-sm">
                    {user?.nombres?.charAt(0) ?? 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[14px] font-bold text-on-surface truncate">
                      {user?.full_name ?? 'Usuario de Campaña'}
                    </div>
                    <div className="text-[12px] text-on-surface-variant truncate">
                      {user?.cmp_code ? `CMP: ${user.cmp_code}` : user?.dni ? `DNI: ${user.dni}` : 'Brigada de Terreno'}
                    </div>
                    <span className="inline-block px-2 py-0.5 mt-1 text-[11px] font-bold uppercase tracking-wider bg-primary-container text-on-primary-container">
                      {user?.role ?? 'Operador'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="py-3">
                <div className="px-4 pb-2 text-[12.5px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Operaciones de Campaña
                </div>
                <nav className="space-y-1 px-2.5">
                  {campLinks.map((item) => {
                    const isActive = location.pathname === item.path || (item.path === '/queue' && location.pathname === '/cola')
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center px-3.5 py-3 text-[14px] transition-colors rounded-none ${
                          isActive
                            ? 'bg-primary-container text-on-primary-container font-semibold'
                            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[22px] mr-3.5 text-primary">
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>

                <div className="px-4 pt-5 pb-2 text-[12.5px] font-bold uppercase tracking-wider text-on-surface-variant border-t border-surface-container-high mt-3">
                  Administración
                </div>
                <nav className="space-y-1 px-2.5">
                  {adminLinks.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center px-3.5 py-3 text-[14px] transition-colors rounded-none ${
                          isActive
                            ? 'bg-primary-container text-on-primary-container font-semibold'
                            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[22px] mr-3.5 text-primary">
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Drawer Bottom Status & Logout */}
            <div className="p-3 bg-surface-container-low border-t border-surface-container-high space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
                <span className="font-semibold text-[11px]">Nodo: {nodeStatus?.node_id ?? 'CUS-VALLE-04'}</span>
                <span className="text-tertiary font-bold flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" /> Sincronizado
                </span>
              </div>
              <button
                type="button"
                onClick={handleMobileLogout}
                className="w-full py-2.5 px-3 bg-error-container/20 hover:bg-error-container/40 text-error font-bold text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 border border-error/30 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace (matching pl-72 on desktop, full width on mobile) */}
      <div className="lg:pl-72">
        <main className="w-full pt-16 pb-24 lg:pb-16 px-3 sm:px-6 lg:px-8 min-h-screen bg-surface-container-low text-on-surface">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
