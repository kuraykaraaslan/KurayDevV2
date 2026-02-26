import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import type { ActionButton, ColumnDef, GridItemRenderProps } from './types'

const IMAGE_KEYS = ['image', 'preview', 'avatar', 'thumbnail', 'cover', 'photo']

function resolveImageUrl(item: Record<string, unknown>): string | null {
  for (const key of IMAGE_KEYS) {
    if (typeof item[key] === 'string' && item[key]) return item[key] as string
  }
  return null
}

function ImagePlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center text-base-content/20">
      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
      </svg>
    </div>
  )
}

function DefaultGridItem<T>({
  item,
  index,
  actions,
  handleActionClick,
  columns,
}: GridItemRenderProps<T> & { columns: ColumnDef<T>[] }) {
  const { t } = useTranslation()
  const itemAny = item as Record<string, unknown>
  const imageUrl = resolveImageUrl(itemAny)
  const imageColumn = columns.find((col) =>
    IMAGE_KEYS.some((key) => col.key.toLowerCase().includes(key))
  )
  const contentColumns = columns.filter((col) => col !== imageColumn).slice(0, 4)

  return (
    <div className="group relative bg-base-200 rounded-lg border border-base-300 overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
      <div className="aspect-video bg-base-300 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={String(itemAny.title ?? itemAny.name ?? 'Item') + ' preview'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>

      <div className="p-3 space-y-1">
        {contentColumns.map((col) => (
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

      {actions && actions.length > 0 && (
        <div className="px-3 pb-3 flex gap-1 flex-wrap">
          {actions.map((action: ActionButton<T>, i: number) =>
            action.href ? (
              <Link
                key={i}
                href={action.href(item as T)}
                className={`btn btn-xs ${action.className || 'btn-primary'}`}
              >
                {action.label}
              </Link>
            ) : (
              <button
                key={i}
                onClick={() => handleActionClick(action, item as T, index)}
                className={`btn btn-xs ${action.className || 'btn-primary'}`}
              >
                {action.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

export default DefaultGridItem
