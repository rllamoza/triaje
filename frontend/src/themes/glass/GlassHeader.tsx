import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useBrandingStore } from '../../store/brandingStore'
import { useThemeStore, THEME_OPTIONS } from '../../store/themeStore'
import { useLogout } from '../../api/hooks'

interface GlassHeaderProps {
  onOpenDrawer?: () => void
}

export function GlassHeader({ onOpenDrawer }: GlassHeaderProps) {
  const { user, logout: logoutStore } = useAuthStore()
  const branding = useBrandingStore()
  const { theme: currentTheme, setTheme } = useThemeStore()
  const logout = useLogout()
  const navigate = useNavigate()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setIsMenuOpen(false)
    try {
      await logout.mutateAsync()
    } catch {}
    logoutStore()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 mx-auto w-full max-w-[1280px] px-2.5 sm:px-4 pt-2 pb-1 bg-[#f6f9fc]/90 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none">
      <div className="rounded-2xl bg-white/88 backdrop-blur-2xl border border-[#cbdbf5] px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between shadow-[0_8px_30px_rgba(10,37,64,0.06)]">
        <div className="flex items-center gap-3.5">
          {/* Drawer trigger */}
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Abrir Menú Clínico"
            className="relative w-10 h-10 rounded-xl bg-white border border-[#cbdbf5] flex items-center justify-center text-[#0a2540] hover:bg-slate-50 active:scale-95 transition-transform shadow-xs cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 ring-2 ring-white" />
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0a2540] text-emerald-400 flex items-center justify-center font-bold text-lg shadow-xs">
              <span className="material-symbols-outlined text-[22px]">potted_plant</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0a2540] tracking-wider uppercase font-sans">
                  {branding.appName}
                </span>
                <span className="text-[10px] font-semibold text-[#0f62fe] bg-[#e8f1ff] px-2 py-0.5 rounded border border-[#0f62fe]/20 uppercase font-sans">
                  Clinica Glass
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline-block">
                Micro-Interactions &amp; Spring Dynamics
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3" ref={menuRef}>
          {/* Spring Physics Telemetry Badge */}
          <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs font-semibold text-emerald-800 tracking-wider">
              SPRING PHYS: 120 FPS
            </span>
          </div>

          {/* User Trigger Button */}
          <div
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#f0f4fc] transition-colors cursor-pointer border border-transparent hover:border-[#cbdbf5]"
            title="Abrir menú de usuario"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0a2540] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.nombres?.charAt(0) ?? 'SC'}
            </div>
            <div className="text-left hidden xl:block">
              <div className="text-xs font-bold text-[#0a2540] leading-tight truncate max-w-[150px]">
                {user?.full_name ?? 'Dr. Personal Médico'}
              </div>
              <div className="text-[11px] text-slate-500 capitalize leading-tight">
                {user?.role ?? 'Operador'}
              </div>
            </div>
            <span className="material-symbols-outlined text-sm text-[#0a2540]">
              {isMenuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </div>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-4 top-16 mt-2 w-80 rounded-2xl bg-white/95 backdrop-blur-2xl border border-[#cbdbf5] shadow-2xl z-50 overflow-hidden divide-y divide-[#cbdbf5]/50 animate-fade-in">
              <div className="p-4 bg-[#f0f4fc]/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0a2540] text-white flex items-center justify-center font-bold text-sm">
                    {user?.nombres?.charAt(0) ?? 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-bold text-[#0a2540] truncate">
                      {user?.full_name ?? 'Usuario del Sistema'}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {user?.cmp_code ? `CMP: ${user.cmp_code}` : 'Personal Clínico'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Selector Section */}
              <div className="p-3 bg-white/70">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#3c5678] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-[#0a2540]">palette</span>
                    Tema Visual
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#0a2540] uppercase px-1.5 py-0.5 bg-[#e8f1ff] rounded border border-[#cbdbf5]">
                    {currentTheme}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {THEME_OPTIONS.map((opt) => {
                    const isSelected = currentTheme === opt.id || (currentTheme === 'glass' && opt.id === 'glass')
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTheme(opt.id)}
                        className={`w-full p-2 flex items-center justify-between border transition-all text-left cursor-pointer rounded-xl ${
                          isSelected
                            ? 'bg-[#e8f1ff] border-[#0a2540] text-[#0a2540] font-bold shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-[#cbdbf5] text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
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
                            <div className="text-xs leading-tight flex items-center gap-1.5 font-bold">
                              {opt.name}
                              {isSelected && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-[#0a2540] text-white rounded-full font-mono">
                                  ACTIVO
                                </span>
                              )}
                            </div>
                            <div className="text-[10.5px] opacity-75 leading-tight truncate">
                              {opt.subtitle}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[17px] text-[#0a2540] shrink-0">
                            check_circle
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="p-2 space-y-1">
                <Link
                  to="/admin/personalizacion"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-[#e8f1ff] hover:text-[#0a2540] rounded-xl transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]">brush</span>
                  Personalización &amp; Logos
                </Link>
                <Link
                  to="/admin/telemetria"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-[#e8f1ff] hover:text-[#0a2540] rounded-xl transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]">hub</span>
                  Integraciones Satelitales
                </Link>
              </div>

              {/* Action Footer */}
              <div className="p-2 bg-[#f0f4fc]/60">
                <button
                  onClick={handleLogout}
                  className="w-full py-2 px-3 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-red-200"
                >
                  <span className="material-symbols-outlined text-[17px]">logout</span>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Telemetry Sub-bar (< md) */}
      <div className="flex md:hidden items-center justify-between px-3 py-1.5 mt-1.5 rounded-xl bg-white/85 backdrop-blur-xl border border-[#cbdbf5] shadow-xs text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse" />
          <span className="font-mono font-semibold text-emerald-800 tracking-wider">SPRING PHYS: 120 FPS</span>
        </div>
        <span className="font-mono font-bold text-[#0a2540] bg-[#e8f1ff] px-2 py-0.5 rounded border border-[#cbdbf5] uppercase tracking-wider">
          CLINICAL ENGINE
        </span>
      </div>
    </header>
  )
}
