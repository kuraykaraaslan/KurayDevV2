'use client'

import { useState } from 'react'
import GenericElement, { GenericElementProps } from '../GenericElement'

/* ================= TYPES ================= */

type DynamicDateValue<T extends boolean | undefined> = T extends true ? Date | null : Date

type DynamicDateOnChange<T extends boolean | undefined> = (value: DynamicDateValue<T>) => void

interface DynamicDateProps<
  TCanBeNull extends boolean | undefined = false,
> extends GenericElementProps {
  canBeNull?: TCanBeNull
  value: DynamicDateValue<TCanBeNull>
  onChange: DynamicDateOnChange<TCanBeNull>
  placeholder?: string
  disabled?: boolean
  disabledError?: string
  min?: string
  max?: string
}

/* ================= COMPONENT ================= */

function DynamicDate<TCanBeNull extends boolean | undefined = false>({
  label,
  className = '',
  canBeNull,
  value,
  onChange,
  placeholder,
  disabled = false,
  disabledError,
  min,
  max,
}: DynamicDateProps<TCanBeNull>) {
  const [showTooltip, setShowTooltip] = useState(false)

  const formattedValue =
    value && !isNaN((value as Date).getTime()) ? (value as Date).toISOString().split('T')[0] : ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value

    if (!raw) {
      if (canBeNull) {
        onChange(null as DynamicDateValue<TCanBeNull>)
      }
      return
    }

    const date = new Date(raw)

    if (isNaN(date.getTime())) {
      if (canBeNull) {
        onChange(null as DynamicDateValue<TCanBeNull>)
      }
      return
    }

    onChange(date as DynamicDateValue<TCanBeNull>)
  }

  return (
    <GenericElement className={className} label={label}>
      <div className="relative">
        <input
          type="date"
          className="input input-bordered w-full"
          placeholder={placeholder || label}
          value={formattedValue}
          onChange={handleChange}
          disabled={disabled}
          min={min}
          max={max}
          onMouseEnter={() => {
            if (disabled && disabledError) setShowTooltip(true)
          }}
          onMouseLeave={() => setShowTooltip(false)}
        />

        {showTooltip && disabled && disabledError && (
          <div className="absolute left-0 mt-1 z-50 bg-error text-error-content text-xs px-3 py-2 rounded shadow-lg whitespace-pre-line">
            {disabledError}
          </div>
        )}
      </div>
    </GenericElement>
  )
}

export default DynamicDate
