import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-primary hover:bg-on-primary-fixed-variant text-on-primary shadow-xs font-semibold',
  secondary:
    'bg-surface-container hover:bg-surface-container-high text-on-surface border border-surface-container-high font-medium',
  ghost:
    'bg-transparent hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-medium',
  danger:
    'bg-error hover:bg-on-error-container text-on-error shadow-xs font-semibold',
  success:
    'bg-tertiary hover:bg-on-tertiary-fixed-variant text-on-tertiary shadow-xs font-semibold',
  warning:
    'bg-[#f1c21b] hover:bg-[#d4a817] text-[#161616] font-semibold',
}

const sizeStyles: Record<Size, string> = {
  sm:  'text-xs px-2.5 py-1.5 gap-1.5',
  md:  'text-xs px-4 py-2.5 gap-2',
  lg:  'text-sm px-5 py-3 gap-2',
  xl:  'text-sm px-6 py-3.5 gap-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center rounded-none select-none cursor-pointer uppercase tracking-wider',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon && <span className="flex shrink-0 items-center">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {iconRight && !loading && (
        <span className="flex shrink-0 items-center">{iconRight}</span>
      )}
    </button>
  )
}
