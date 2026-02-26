import { useTranslation } from 'react-i18next'
import { useTableContext } from '../core/TableContext'

function ColumnToggle() {
  const { t } = useTranslation()
  const { columns, hiddenColumns, toggleColumnVisibility } = useTableContext()

  return (
    <div className="dropdown dropdown-end">
      <button tabIndex={0} className="btn btn-sm btn-ghost" title={t('common.columns')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="5" height="18" rx="1" />
          <rect x="10" y="3" width="5" height="18" rx="1" />
          <rect x="17" y="3" width="4" height="18" rx="1" />
        </svg>
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content z-10 menu p-2 shadow-lg bg-base-100 border border-base-300 rounded-box w-48 mt-1"
      >
        {columns.map((col) => (
          <li key={col.key}>
            <label className="flex items-center gap-2 cursor-pointer py-1.5">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={!hiddenColumns.has(col.key)}
                onChange={() => toggleColumnVisibility(col.key)}
              />
              <span className="text-sm">{t(col.header)}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ColumnToggle
