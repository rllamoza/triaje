import elrondCrossLogo from '../../assets/elrond-cross-logo.png'
import { useBrandingStore } from '../../store/brandingStore'
import { useThemeStore } from '../../store/themeStore'

interface AppFooterProps {
  className?: string
}

export function AppFooter({ className = '' }: AppFooterProps) {
  const branding = useBrandingStore()
  const { theme } = useThemeStore()

  // Base platform cross logo: always uses the official ElRond cross logo with the 'e'
  const crossLogo = elrondCrossLogo || branding.crossLogoUrl || '/elrond-cross-logo.png'

  const developerLink = branding.developerUrl || 'https://elrond.salud'
  const developerText = branding.developerName || 'Página del Desarrollador'

  const themeClasses =
    theme === 'cyberpunk'
      ? 'bg-[#06050e]/90 text-slate-400 border-purple-900/40 font-mono shadow-[0_-2px_15px_rgba(0,0,0,0.4)]'
      : theme === 'glass'
      ? 'bg-white/70 backdrop-blur-md text-slate-500 border-[#cbdbf5]/70 font-sans shadow-[0_-2px_10px_rgba(10,37,64,0.02)]'
      : 'bg-surface/90 text-on-surface-variant border-surface-container-high font-body shadow-[0_-1px_4px_rgba(0,0,0,0.02)]'

  return (
    <footer
      aria-label="Pie de página institucional y créditos"
      className={`w-full py-1.5 sm:py-2 px-3 sm:px-6 border-t text-[10.5px] sm:text-[11px] select-none transition-colors ${themeClasses} ${className}`}
    >
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4 text-center sm:text-left">
        {/* Left / Center Identity: Cross Logo + Base App Full Name */}
        <div className="flex items-center flex-wrap justify-center sm:justify-start gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <img
              src={crossLogo}
              alt="Logo Cruz ElRond"
              className="h-3.5 sm:h-4 w-auto object-contain rounded-xs filter drop-shadow-xs shrink-0"
            />
            <span className="font-bold tracking-tight text-inherit">
              ElRond - Sistema de Gestión Médica - Módulo Triaje
            </span>
          </div>

          <span className="hidden md:inline opacity-30 text-[10px]">•</span>

          <span className="opacity-70 text-[10px] hidden lg:inline">
            Plataforma Asistencial &amp; Telemetría
          </span>
        </div>

        {/* Right / Developer Page Link */}
        <div className="flex items-center gap-1.5 shrink-0 text-[10px] sm:text-[10.5px]">
          <span className="opacity-65">Desarrollo:</span>
          <a
            href={developerLink}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir página oficial del desarrollador de ElRond"
            className={`inline-flex items-center gap-0.5 font-semibold transition-colors hover:underline ${
              theme === 'cyberpunk'
                ? 'text-cyan-400 hover:text-cyan-300'
                : theme === 'glass'
                ? 'text-[#0f62fe] hover:text-[#0043ce]'
                : 'text-primary hover:text-on-primary-fixed-variant'
            }`}
          >
            <span>{developerText}</span>
            <span className="material-symbols-outlined text-[11px] leading-none">
              open_in_new
            </span>
          </a>
        </div>
      </div>
    </footer>
  )
}
