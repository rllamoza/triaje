import React, { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, iconLeft, iconRight, fullWidth = true, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={`flex flex-col gap-1 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant flex items-center justify-between"
          >
            <span>{label}</span>
          </label>
        )}
        <div className="relative flex items-center bg-surface-container focus-within:bg-surface border border-surface-container-high focus-within:border-primary transition-colors">
          {iconLeft && (
            <span className="absolute left-3 text-secondary text-lg flex items-center pointer-events-none">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-transparent py-2.5 px-3 text-xs text-on-surface focus:outline-none placeholder:text-secondary/60 rounded-none ${iconLeft ? 'pl-10' : ''} ${iconRight ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-3 text-secondary flex items-center">
              {iconRight}
            </span>
          )}
        </div>
        {error && (
          <p className="text-[11px] text-error font-medium mt-0.5">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[11px] text-secondary mt-0.5">{hint}</p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

/* ── Select ──────────────────────────────────────────────────── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string | number; label: string }[]
  placeholder?: string
  fullWidth?: boolean
}

export function Select({
  label,
  error,
  options,
  placeholder,
  fullWidth = true,
  id,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center bg-surface-container border border-surface-container-high focus-within:border-primary focus-within:bg-surface">
        <select
          id={selectId}
          className={`w-full bg-transparent py-2.5 px-3 pr-8 text-xs text-on-surface focus:outline-none appearance-none cursor-pointer rounded-none font-medium ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-2.5 pointer-events-none text-secondary text-[18px]">
          expand_more
        </span>
      </div>
      {error && <p className="text-[11px] text-error font-medium mt-0.5">{error}</p>}
    </div>
  )
}

/* ── Textarea ─────────────────────────────────────────────────── */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

export function Textarea({ label, error, fullWidth = true, id, className = '', ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full bg-surface-container focus:bg-surface border border-surface-container-high focus:border-primary p-3 text-xs text-on-surface focus:outline-none rounded-none resize-y min-h-[80px] ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-error font-medium mt-0.5">{error}</p>}
    </div>
  )
}
