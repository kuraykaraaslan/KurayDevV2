import GenericElement, { GenericElementProps } from '../GenericElement'

export interface DynamicNumberProps extends GenericElementProps {
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const DynamicNumber: React.FC<DynamicNumberProps> = ({
  label,
  className = '',
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  disabled = false,
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'input-sm' : size === 'lg' ? 'input-lg' : 'input-md'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') {
      onChange(null)
      return
    }
    const parsed = parseFloat(raw)
    onChange(isNaN(parsed) ? null : parsed)
  }

  return (
    <GenericElement label={label} className={className}>
      <input
        type="number"
        className={`input input-bordered ${sizeClass} w-full`}
        value={value ?? ''}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
    </GenericElement>
  )
}

export default DynamicNumber
