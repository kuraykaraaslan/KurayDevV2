import { useTranslation } from 'react-i18next'
import { useTableContext } from '../core/TableContext'

interface SearchInputProps {
  placeholder?: string
  className?: string
}

function SearchInput({ placeholder = 'common.search', className = '' }: SearchInputProps) {
  const { t } = useTranslation()
  const { search, setSearch } = useTableContext()

  return (
    <input
      type="text"
      placeholder={t(placeholder)}
      className={`input input-bordered w-full md:w-64 max-w-xs ${className}`}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  )
}

export default SearchInput
