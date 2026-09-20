import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useScannerStore } from '../../store/scannerStore'

export function GlassFab() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { openScanner } = useScannerStore()

  const actions = [
    {
      label: 'Triaje Vital',
      icon: 'vital_signs',
      color: 'bg-blue-600',
      onClick: () => navigate('/triaje'),
    },
    {
      label: 'Consulta Médica',
      icon: 'stethoscope',
      color: 'bg-emerald-600',
      onClick: () => navigate('/consulta'),
    },
    {
      label: 'Ticket Térmico',
      icon: 'receipt_long',
      color: 'bg-cyan-600',
      onClick: () => navigate('/tickets'),
    },
    {
      label: 'Escanear QR',
      icon: 'qr_code_scanner',
      color: 'bg-indigo-600',
      onClick: () => openScanner(),
    },
  ]

  return (
    <div className="fixed bottom-22 right-4 md:bottom-24 md:right-6 xl:bottom-6 xl:right-8 z-40 flex flex-col items-end pointer-events-none">
      {/* Radial Fan-Out Submenu */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col gap-2.5 mb-3 items-end pointer-events-auto">
            {actions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.8 }}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 28,
                  delay: i * 0.04,
                }}
                onClick={() => {
                  setIsOpen(false)
                  action.onClick()
                }}
                className="flex items-center gap-2.5 bg-white text-[#0a2540] border border-[#cbdbf5] px-4 py-2 rounded-full shadow-lg text-xs font-semibold hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
              >
                <span>{action.label}</span>
                <span
                  className={`w-7 h-7 rounded-full ${action.color} text-white flex items-center justify-center shadow-xs`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {action.icon}
                  </span>
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Trigger FAB */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Acciones Rápidas de Campo"
        className="pointer-events-auto w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#0a2540] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(10,37,64,0.3)] hover:bg-[#133b63] active:scale-90 transition-transform cursor-pointer"
      >
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className="material-symbols-outlined text-[24px] md:text-[28px]"
        >
          add
        </motion.span>
      </button>
    </div>
  )
}
