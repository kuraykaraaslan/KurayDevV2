import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTableCells, faGrip } from '@fortawesome/free-solid-svg-icons'
import { useTableContext } from '../core/TableContext'

function ViewToggle() {
  const { t } = useTranslation()
  const { viewMode, setViewMode } = useTableContext()

  return (
    <div className="join">
      <button
        className={`join-item btn btn-sm ${viewMode === 'table' ? 'btn-active' : ''}`}
        onClick={() => setViewMode('table')}
        title={t('common.table_view')}
      >
        <FontAwesomeIcon icon={faTableCells} />
      </button>
      <button
        className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-active' : ''}`}
        onClick={() => setViewMode('grid')}
        title={t('common.grid_view')}
      >
        <FontAwesomeIcon icon={faGrip} />
      </button>
    </div>
  )
}

export default ViewToggle
