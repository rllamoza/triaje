import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useBrandingStore } from '../../store/brandingStore'
import { useThemeStore, THEME_OPTIONS } from '../../store/themeStore'
import { useLogout } from '../../api/hooks'

interface CyberHeaderProps {
  onOpenDrawer?: () => void
}

export function CyberHeader({ onOpenDrawer }: CyberHeaderProps) {
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
    <header className="sticky top-0 z-30 mx-auto w-full max-w-[1280px] px-2.5 sm:px-4 pt-2 pb-1 bg-[#05050d]/90 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none">
      <div className="rounded-2xl bg-[#0b0a16]/90 backdrop-blur-2xl border border-purple-500/30 px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between shadow-[0_0_35px_rgba(168,85,247,0.2)]">
        <div className="flex items-center gap-3.5">
          {/* Drawer trigger */}
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Abrir Menú Cuántico"
            className="relative w-10 h-10 rounded-xl bg-[#131126] border border-purple-500/40 flex items-center justify-center text-fuchsia-400 hover:text-white hover:border-fuchsia-400 active:scale-95 transition-all shadow-[0_0_12px_rgba(168,85,247,0.25)] cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 absolute -top-0.5 -right-0.5 shadow-[0_0_8px_#06b6d4]" />
            <span className="material-symbols-outlined text-[22px]">bolt</span>
          </button>

          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-fuchsia-600 text-white flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(217,70,239,0.5)]">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-widest uppercase font-mono">
                  {branding.appName}
                </span>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/30 uppercase font-mono tracking-wider">
                  Cyberpunk HUD
                </span>
              </div>
              <span className="text-[11px] font-mono text-fuchsia-300/80 hidden sm:inline-block">
                Quantum Synth Dynamics • v2.5
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3" ref={menuRef}>
          {/* Cyber HUD Status Badge */}
          <div className="hidden md:flex items-center gap-2 bg-purple-950/60 border border-purple-800/40 px-3 py-1.5 rounded-xl shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <span className="font-mono text-xs font-semibold text-emerald-300 tracking-wider">
              CORE: NEXUS-99
            </span>
          </div>

          {/* User Trigger Button */}
          <div
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl bg-[#131126]/80 hover:bg-purple-950/60 transition-colors cursor-pointer border border-purple-500/30 hover:border-fuchsia-400"
            title="Abrir menú de usuario"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_10px_rgba(217,70,239,0.5)]">
              {user?.nombres?.charAt(0) ?? 'NX'}
            </div>
            <div className="text-left hidden xl:block">
              <div className="text-xs font-bold text-white font-mono leading-tight truncate max-w-[150px]">
                {user?.full_name ?? 'Operador Synth'}
              </div>
              <div className="text-[11px] text-fuchsia-300/70 font-mono capitalize leading-tight">
                {user?.role ?? 'Cyber Triage'}
              </div>
            </div>
            <span className="material-symbols-outlined text-sm text-fuchsia-400">
              {isMenuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </div>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-4 top-16 mt-2 w-80 rounded-2xl bg-[#0b0a16]/95 backdrop-blur-2xl border border-purple-500/40 shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden divide-y divide-purple-900/40 animate-fade-in">
              <div className="p-4 bg-purple-950/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_12px_rgba(217,70,239,0.5)]">
                    {user?.nombres?.charAt(0) ?? 'U'}
                  </div>
                  <div className="overflow-hidden font-mono">
                    <div className="text-sm font-bold text-white truncate">
                      {user?.full_name ?? 'Usuario del Sistema'}
                    </div>
                    <div className="text-xs text-fuchsia-300/70 truncate">
                      {user?.cmp_code ? `CMP: ${user.cmp_code}` : 'Nexus Protocol'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Selector Section */}
              <div className="p-3 bg-black/40">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-fuchsia-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-fuchsia-400">palette</span>
                    Tema Visual
                  </span>
                  <span className="text-[10px] font-mono font-bold text-fuchsia-300 uppercase px-1.5 py-0.5 bg-purple-950/80 rounded border border-purple-800">
                    {currentTheme}
                  </span>
                </div>

                <div className="space-y-1.5 font-mono">
                  {THEME_OPTIONS.map((opt) => {
                    const isSelected = currentTheme === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTheme(opt.id)}
                        className={`w-full p-2 flex items-center justify-between border transition-all text-left cursor-pointer rounded-xl ${
                          isSelected
                            ? 'bg-purple-950/80 border-fuchsia-500 text-white font-bold shadow-[0_0_15px_rgba(217,70,239,0.35)]'
                            : 'bg-[#131126]/60 hover:bg-[#131126] border-purple-900/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex items-center -space-x-1 shrink-0">
                            {opt.previewColors.map((colorHex, idx) => (
                              <span
                                key={idx}
                                className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs inline-block"
                                style={{ backgroundColor: colorHex }}
                              />
                            ))}
                          </div>
                          <div className="truncate">
                            <div className="text-xs leading-tight flex items-center gap-1.5 font-bold">
                              {opt.name}
                              {isSelected && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-fuchsia-600 text-white rounded-full font-mono">
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
                          <span className="material-symbols-outlined text-[17px] text-fuchsia-400 shrink-0">
                            check_circle
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="p-2 space-y-1 font-mono">
                <Link
                  to="/admin/personalizacion"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-purple-950/50 hover:text-fuchsia-300 rounded-xl transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]">brush</span>
                  Personalización &amp; Logos
                </Link>
                <Link
                  to="/admin/telemetria"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-purple-950/50 hover:text-fuchsia-300 rounded-xl transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]">hub</span>
                  Telemetría Starlink
                </Link>
              </div>

              {/* Action Footer */}
              <div className="p-2 bg-purple-950/30">
                <button
                  onClick={handleLogout}
                  className="w-full py-2 px-3 text-xs font-mono font-bold text-rose-400 hover:bg-rose-950/30 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-rose-900/50"
                >
                  <span className="material-symbols-outlined text-[17px]">logout</span>
                  Desconectar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Telemetry Sub-bar (< md) */}
      <div className="flex md:hidden items-center justify-between px-3 py-1.5 mt-1.5 rounded-xl bg-[#0b0a16]/85 backdrop-blur-xl border border-purple-500/25 shadow-xs font-mono text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse" />
          <span className="font-semibold text-emerald-300 tracking-wider">SPRING PHYS: 120 FPS</span>
        </div>
        <span className="font-bold text-fuchsia-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-700/40 uppercase tracking-wider">
          QUANTUM ENGINE
        </span>
      </div>
    </header>
  )
}
