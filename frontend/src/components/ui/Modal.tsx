import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  footer?: React.ReactNode
}

const sizeMap = {
  sm:   480,
  md:   600,
  lg:   800,
  xl:   1000,
  full: '95vw',
}

export function Modal({ open, onClose, title, subtitle, children, size = 'md', footer }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: sizeMap[size],
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--border)',
                  flexShrink: 0,
                }}
              >
                <div>
                  {title && (
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  id="modal-close-btn"
                  style={{
                    background: 'var(--bg-overlay)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    fontSize: 18,
                    transition: 'background var(--ease-default)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-overlay)')}
                >
                  ×
                </button>
              </div>
            )}

            {/* Body */}
            <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>{children}</div>

            {/* Footer */}
            {footer && (
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'flex-end',
                  flexShrink: 0,
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
