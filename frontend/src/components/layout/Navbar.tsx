import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useBrandingStore } from '../../store/brandingStore'
import { useThemeStore, THEME_OPTIONS } from '../../store/themeStore'
import { useScannerStore } from '../../store/scannerStore'
import { useLogout, useNodeStatus, useCampaigns } from '../../api/hooks'
import { HardwareStatusBar } from '../common/HardwareStatusBar'

interface NavbarProps {
  onOpenMobileMenu?: () => void
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const { user, campaignId, logout: logoutStore } = useAuthStore()
  const branding = useBrandingStore()
  const { theme: currentTheme, setTheme } = useThemeStore()
  const { openScanner } = useScannerStore()
  const logout = useLogout()
  const navigate = useNavigate()
  const { data: nodeStatus } = useNodeStatus()
  const { data: campaigns } = useCampaigns()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeCampaign = campaigns?.find((c) => c.id === campaignId) ?? campaigns?.find((c) => c.status === 'active') ?? {
    id: 1,
    name: 'Cusco - Valle Sagrado 2025',
    location_name: 'Rumichaca, Urubamba (2,870 msnm)',
  }

  const handleLogout = async () => {
    setIsMenuOpen(false)
    try { await logout.mutateAsync() } catch {}
    logoutStore()
    navigate('/login')
  }

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface z-50 shadow-[0_1px_8px_rgba(0,0,0,0.06)] border-b border-surface-container-high">
      <div className="h-16 w-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              type="button"
              className="md:hidden p-1.5 -ml-1 text-on-surface-variant hover:text-on-surface flex items-center justify-center cursor-pointer"
              title="Abrir menú"
              aria-label="Abrir menú hamburguesa"
            >
              <span className="material-symbols-outlined text-[26px]">menu</span>
            </button>
          )}

          <Link to="/" className="flex items-center gap-2 sm:gap-2.5">
            {branding.logoUrl ? (
              <img
                alt={branding.appName}
                className="h-8 sm:h-9 w-auto max-w-[140px] sm:max-w-[160px] object-contain"
                src={branding.logoUrl}
              />
            ) : (
              <div className="h-8 sm:h-9 px-2 sm:px-2.5 bg-primary text-on-primary text-[12px] sm:text-[13px] font-bold flex items-center justify-center tracking-wider uppercase">
                {branding.appName}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold tracking-tight text-on-surface truncate max-w-[130px] sm:max-w-none">
                {branding.appName}
              </span>
              <span className="text-sm text-on-surface-variant hidden xl:inline">|</span>
              <span className="text-[13px] font-medium text-on-surface-variant uppercase tracking-wider hidden xl:inline truncate max-w-[240px]">
                {branding.appTagline}
              </span>
            </div>
          </Link>
        </div>

        {/* Campaign & Offline status */}
        <div className="flex items-center gap-2 lg:gap-3 min-w-0">
          <Link
            to="/campaigns"
            className="hidden md:flex items-center bg-surface-container hover:bg-surface-container-high px-2.5 lg:px-3 py-1.5 gap-1.5 lg:gap-2 transition-colors border border-surface-container-high cursor-pointer min-w-0"
            title="Cambiar campaña activa"
          >
            <span className="material-symbols-outlined text-[17px] text-primary shrink-0">local_hospital</span>
            <span className="text-[12px] lg:text-[13px] font-medium text-on-surface truncate max-w-[120px] lg:max-w-[180px] xl:max-w-[240px]">
              Campaña: {activeCampaign.name}
            </span>
            <span className="material-symbols-outlined text-[17px] text-primary shrink-0">expand_more</span>
          </Link>

          {/* Telemetría Compacta de Hardware y Nodo */}
          <HardwareStatusBar variant="compact" className="hidden sm:inline-flex" />

          <div className="hidden xl:flex items-center bg-tertiary-container text-on-tertiary-container px-2 lg:px-2.5 py-1 gap-1 lg:gap-1.5 border border-tertiary/20 shrink-0">
            <span className="material-symbols-outlined text-[15px] lg:text-[16px] text-tertiary shrink-0">cloud_done</span>
            <span className="text-[11.5px] lg:text-[12.5px] font-medium tracking-tight whitespace-nowrap">
              <span>{nodeStatus?.db_synced ? 'Sincronizado' : 'Modo Offline'}</span>
            </span>
          </div>
        </div>

        {/* QR Scanner, Notifications & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0" ref={menuRef}>
          {/* Quick QR Scanner Button */}
          <button
            type="button"
            onClick={openScanner}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-primary text-on-primary hover:bg-on-primary-fixed-variant text-[11.5px] sm:text-[12.5px] font-bold tracking-wide uppercase transition-colors shadow-xs cursor-pointer rounded-none shrink-0"
            title="Escanear Código QR de Paciente / Ticket"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span className="hidden lg:inline">Escanear QR</span>
          </button>

          <div
            className="relative flex items-center justify-center p-1.5 sm:p-2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer shrink-0"
            title="Notificaciones de campo"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">notifications</span>
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-error" />
            </span>
          </div>

          {/* User Trigger Button for Menu */}
          <div
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 lg:gap-3 p-1 sm:p-1.5 hover:bg-surface-container transition-colors cursor-pointer border border-transparent hover:border-surface-container-highest shrink-0"
            title="Abrir menú de usuario"
          >
            <div className="text-right hidden xl:block">
              <div className="text-[13.5px] font-bold text-on-surface leading-tight truncate max-w-[160px]">
                {user?.full_name ?? 'Dr. Personal Médico'}
              </div>
              <div className="text-[11.5px] text-on-surface-variant leading-tight mt-0.5 capitalize font-medium">
                {user?.role === 'admin'
                  ? 'Administrador General'
                  : user?.role === 'medico'
                  ? 'Médico Evaluador'
                  : user?.role === 'triaje'
                  ? 'Enfermería Triaje'
                  : 'Admisión & Filiación'}
              </div>
            </div>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm text-xs sm:text-sm font-bold shrink-0">
              {user?.nombres?.charAt(0) ?? <span className="material-symbols-outlined text-[18px]">person</span>}
            </div>

            <span className="material-symbols-outlined text-sm text-on-surface-variant">
              {isMenuOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
            </span>
          </div>

          {/* Direct Logout shortcut */}
          <button
            onClick={handleLogout}
            title="Cerrar sesión rápida"
            className="p-1.5 sm:p-2 text-on-surface-variant hover:text-error transition-colors flex items-center cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">logout</span>
          </button>

          {/* Interactive User Profile Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-4 top-16 mt-1 w-80 bg-surface border border-surface-container-highest shadow-2xl z-50 animate-fade-in divide-y divide-surface-container-high">
              {/* User Header Summary */}
              <div className="p-4 bg-surface-container-low">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-base">
                    {user?.nombres?.charAt(0) ?? 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[14px] font-bold text-on-surface truncate">
                      {user?.full_name ?? 'Usuario del Sistema'}
                    </div>
                    <div className="text-[12.5px] text-on-surface-variant truncate">
                      {user?.cmp_code ? `CMP: ${user.cmp_code}` : user?.dni ? `DNI: ${user.dni}` : 'Personal de Brigada'}
                    </div>
                    <span className="inline-block px-2 py-0.5 mt-1 text-[11.5px] font-bold uppercase tracking-wider bg-primary-container text-on-primary-container">
                      {user?.role ?? 'Operador'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Options */}
              <div className="py-1">
                <Link
                  to="/admin/personalizacion"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full px-4 py-3 flex items-center gap-3.5 text-on-surface hover:bg-surface-container transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[20px] text-primary">palette</span>
                  <div>
                    <div className="text-[14px] font-semibold leading-none">Personalización &amp; Logos</div>
                    <div className="text-[12px] text-on-surface-variant mt-1">Títulos, subtítulos y logotipos exportables</div>
                  </div>
                </Link>

                <Link
                  to="/admin/usuarios"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full px-4 py-3 flex items-center gap-3.5 text-on-surface hover:bg-surface-container transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[20px] text-secondary">manage_accounts</span>
                  <div>
                    <div className="text-[14px] font-semibold leading-none">Gestión de Usuarios</div>
                    <div className="text-[12px] text-on-surface-variant mt-1">Roles, permisos y PIN de guardia</div>
                  </div>
                </Link>

                <Link
                  to="/admin/telemetria"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full px-4 py-3 flex items-center gap-3.5 text-on-surface hover:bg-surface-container transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[20px] text-tertiary">hub</span>
                  <div>
                    <div className="text-[14px] font-semibold leading-none">Integraciones &amp; Telemetría</div>
                    <div className="text-[12px] text-on-surface-variant mt-1">Webhooks, Starlink y sincronización P2P</div>
                  </div>
                </Link>

                <Link
                  to="/admin/auditoria"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full px-4 py-3 flex items-center gap-3.5 text-on-surface hover:bg-surface-container transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[20px] text-primary">policy</span>
                  <div>
                    <div className="text-[14px] font-semibold leading-none">Auditoría Forense &amp; Red</div>
                    <div className="text-[12px] text-on-surface-variant mt-1">Logs inmutables, IP, dispositivos y audi_triaje</div>
                  </div>
                </Link>
              </div>

              {/* Theme Selector Section */}
              <div className="p-3 bg-surface-container-low/60 border-t border-surface-container-high">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-primary">palette</span>
                    Tema Visual
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-on-surface-variant/80 uppercase px-1.5 py-0.5 bg-surface rounded border border-surface-container-high">
                    {currentTheme}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {THEME_OPTIONS.map((opt) => {
                    const isSelected = currentTheme === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTheme(opt.id)}
                        className={`w-full p-2 flex items-center justify-between border transition-all text-left cursor-pointer rounded ${
                          isSelected
                            ? 'bg-primary-container/90 border-primary text-on-primary-container shadow-xs font-semibold ring-1 ring-primary/30'
                            : 'bg-surface hover:bg-surface-container border-surface-container-high text-on-surface'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Color Preview Dots */}
                          <div className="flex items-center -space-x-1 shrink-0">
                            {opt.previewColors.map((colorHex, idx) => (
                              <span
                                key={idx}
                                className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs inline-block"
                                style={{ backgroundColor: colorHex }}
                              />
                            ))}
                          </div>
                          <div className="truncate">
                            <div className="text-[13px] leading-tight flex items-center gap-1.5 font-bold">
                              {opt.name}
                              {isSelected && (
                                <span className="text-[9.5px] px-1.5 py-0.2 bg-primary text-on-primary rounded-full font-mono font-medium">
                                  ACTIVO
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] opacity-75 leading-tight truncate">
                              {opt.subtitle}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[18px] text-primary shrink-0 ml-1">
                            check_circle
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-2.5 bg-surface-container-low">
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2.5 text-[13.5px] font-bold text-error hover:bg-error-container/20 flex items-center justify-center gap-2 transition-colors cursor-pointer border border-error/20"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
