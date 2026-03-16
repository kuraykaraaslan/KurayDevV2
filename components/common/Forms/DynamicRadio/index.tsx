import GenericElement, { GenericElementProps } from '../GenericElement'

export interface DynamicRadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface DynamicRadioProps extends GenericElementProps {
  options: DynamicRadioOption[]
  selectedValue: string
  onChange: (value: string) => void
  layout?: 'vertical' | 'horizontal'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const DynamicRadio: React.FC<DynamicRadioProps> = ({
  label,
  className = '',
  options,
  selectedValue,
  onChange,
  layout = 'vertical',
  size = 'md',
  disabled = false,
}) => {
  const sizeClass = size === 'sm' ? 'radio-sm' : size === 'lg' ? 'radio-lg' : 'radio-md'
  const name = label ? label.toLowerCase().replace(/\s+/g, '-') : 'radio-group'

  return (
    <GenericElement label={label} className={className}>
      <div className={`flex gap-3 ${layout === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'}`}>
        {options.map((option) => {
          const isDisabled = disabled || option.disabled

          return (
            <label
              key={option.value}
              className={`flex items-start gap-3 cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name={name}
                className={`radio radio-primary ${sizeClass} mt-0.5 shrink-0`}
                value={option.value}
                checked={selectedValue === option.value}
                onChange={() => onChange(option.value)}
                disabled={isDisabled}
              />
              <div>
                <span className="label-text font-medium">{option.label}</span>
                {option.description && (
                  <p className="text-xs text-base-content/60">{option.description}</p>
                )}
              </div>
            </label>
          )
        })}
      </div>
    </GenericElement>
  )
}

export default DynamicRadio
