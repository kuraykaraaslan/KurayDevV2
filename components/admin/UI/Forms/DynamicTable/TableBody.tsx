'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useTableContext, ColumnDef, ActionButton, GridItemRenderProps } from './TableContext'

interface TableBodyProps {
  className?: string
  emptyText?: string
}

// Default Grid Item Component
function DefaultGridItem<T>({
  item,
  index,
  actions,
  handleActionClick,
  columns,
}: GridItemRenderProps<T> & { columns: ColumnDef<T>[] }) {
  const { t } = useTranslation()

  // Find image URL directly from item (common property names)
  const itemAny = item as Record<string, unknown>
  const imageUrl =
    (itemAny.image as string) ||
    (itemAny.thumbnail as string) ||
    (itemAny.avatar as string) ||
    (itemAny.preview as string) ||
    (itemAny.cover as string) ||
    (itemAny.photo as string) ||
    null

  // Find image column key to exclude from content
  const imageColumnKeys = ['image', 'preview', 'avatar', 'thumbnail', 'cover', 'photo']
  const imageColumn = columns.find((col) =>
    imageColumnKeys.some((key) => col.key.toLowerCase().includes(key))
  )

  // Other columns (exclude image column)
  const otherColumns = columns.filter((col) => col !== imageColumn).slice(0, 4)

  return (
    <div className="group relative bg-base-200 rounded-lg border border-base-300 overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
      {/* Image/Preview Section */}
      <div className="aspect-video bg-base-300 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base-content/20">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1">
        {otherColumns.map((col) => (
          <div key={col.key} className="flex items-start gap-2">
            <span className="text-[10px] text-base-content/40 uppercase min-w-[60px]">
              {t(col.header)}:
            </span>
            <span className="text-xs text-base-content/70 truncate flex-1">
              {col.accessor(item as T, index)}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="px-3 pb-3 flex gap-1 flex-wrap">
          {actions.map((action: ActionButton<T>, actionIndex: number) =>
            action.href ? (
              <Link
                key={actionIndex}
                href={action.href(item as T)}
                className={`btn btn-xs ${action.className || 'btn-primary'}`}
              >
                {t(action.label)}
              </Link>
            ) : (
              <button
                key={actionIndex}
                onClick={() => handleActionClick(action, item as T, index)}
                className={`btn btn-xs ${action.className || 'btn-primary'}`}
              >
                {t(action.label)}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

function TableBody({ className = '', emptyText }: TableBodyProps) {
  const { t } = useTranslation()
  const {
    data = [],
    columns,
    actions,
    idKey,
    loading,
    handleActionClick,
    viewMode,
    gridItemRenderer,
    gridClassName,
  } = useTableContext()

  // Loading state
  if (loading) {
    return (
      <div className={`w-full bg-base-200 mt-4 rounded-lg min-h-[400px] flex items-center justify-center ${className}`}>
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className={`w-full bg-base-200 mt-4 rounded-lg min-h-[400px] flex items-center justify-center ${className}`}>
        <p className="text-base-content/50">{emptyText ? t(emptyText) : t('common.no_data')}</p>
      </div>
    )
  }

  // Grid view - use custom renderer or default
  if (viewMode === 'grid') {
    return (
      <div className={`mt-4 ${gridClassName || 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'} ${className}`}>
        {data.map((item: any, index: number) => (
          <div key={String(item[idKey]) || index}>
            {gridItemRenderer ? (
              gridItemRenderer({
                item,
                index,
                actions,
                handleActionClick,
              })
            ) : (
              <DefaultGridItem
                item={item}
                index={index}
                actions={actions}
                handleActionClick={handleActionClick}
                columns={columns}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  // Table view (default)
  return (
    <div className={`overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px] ${className}`}>
      <table className="table">
        <thead className="bg-base-300 h-12">
          <tr className="h-12">
            {columns.map((col: ColumnDef<any>) => (
              <th key={col.key} className={`${col.className || ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}>
                {t(col.header)}
              </th>
            ))}
            {actions && actions.length > 0 && <th>{t('common.action')}</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item: any, index: number) => (
            <tr
              key={String(item[idKey]) || index}
              className="h-12 hover:bg-primary hover:bg-opacity-10"
            >
              {columns.map((col: ColumnDef<any>) => (
                <td
                  key={col.key}
                  className={`${col.className || ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                  onClick={() => (col.onClick ? col.onClick(item, index) : undefined)}
                  style={{ cursor: col.onClick ? 'pointer' : 'default' }}
                >
                  {col.accessor(item, index)}
                </td>
              ))}
              {actions && actions.length > 0 && (
                <td className="flex gap-2">
                  {actions
                    .filter((action: ActionButton<any>) => !action.hidden || !action.hidden(item))
                    .map((action: ActionButton<any>, actionIndex: number) =>
                    action.href ? (
                      <Link
                        key={actionIndex}
                        href={action.href(item)}
                        className={`btn btn-sm ${action.className || 'btn-primary'} ${action.hideOnMobile ? 'hidden md:flex' : ''}`}
                      >
                        {t(action.label)}
                      </Link>
                    ) : (
                      <button
                        key={actionIndex}
                        onClick={() => handleActionClick(action, item, index)}
                        className={`btn btn-sm ${action.className || 'btn-primary'} ${action.hideOnMobile ? 'hidden md:flex' : ''}`}
                      >
                        {t(action.label)}
                      </button>
                    )
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TableBody
