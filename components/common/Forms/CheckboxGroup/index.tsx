import GenericElement from '@/components/common/Forms/GenericElement'

interface CheckboxGroupProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
}

const CheckboxGroup = ({ label, options, selected, onChange }: CheckboxGroupProps) => (
  <GenericElement label={label}>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label key={opt} className="bg-base-100 p-2 rounded-lg flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={(e) =>
              onChange(e.target.checked ? [...selected, opt] : selected.filter((s) => s !== opt))
            }
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  </GenericElement>
)

export default CheckboxGroup
