import React from 'react'

export interface DynamicToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const DynamicToggle: React.FC<DynamicToggleProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = '',
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'toggle-sm' : size === 'lg' ? 'toggle-lg' : 'toggle-md'

  return (
    <div className={`form-control ${className}`}>
      <label className="label cursor-pointer justify-start gap-4">
        <input
          type="checkbox"
          className={`toggle toggle-primary ${sizeClass}`}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div>
          <span className="label-text font-medium">{label}</span>
          {description && <p className="text-xs text-base-content/60">{description}</p>}
        </div>
      </label>
    </div>
  )
}

export default DynamicToggle
