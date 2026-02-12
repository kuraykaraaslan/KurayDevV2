import GenericElement, { GenericElementProps } from '../GenericElement'

export interface DynamicTextProps extends GenericElementProps {
  value: string
  placeholder?: string
  setValue: (value: string) => void
  size?: 'sm' | 'md' | 'lg'
  isTextarea?: boolean
}

const DynamicText: React.FC<DynamicTextProps> = ({
  label,
  placeholder,
  className = '',
  value,
  setValue,
  size = 'md',
  isTextarea = false,
}) => {
  const sizeClass = size === 'sm' ? 'input-sm' : size === 'lg' ? 'input-lg' : 'input-md'

  return (
    <GenericElement label={label} className={className}>
      {isTextarea ? (
        <textarea
          className={`textarea ${sizeClass} w-full`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className={`input ${sizeClass} w-full`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}
    </GenericElement>
  )
}

export default DynamicText
