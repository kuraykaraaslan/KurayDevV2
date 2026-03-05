import type { ReactNode } from 'react'
import Link from '@/libs/i18n/Link'
import { SearchTypeColors, SearchResultItemType } from '@/types/content/SearchTypes'

export interface ResultElementProps {
  item: SearchResultItemType
  index: number
  /** Whether this item is the keyboard-active item */
  isActive?: boolean
  /** The current search query — used to highlight matching text */
  highlightQuery?: string
  /** Stable HTML id for aria-activedescendant */
  id?: string
}

/** Highlight matching substrings within text */
function HighlightedText({ text, query }: { text: string; query: string }): ReactNode {
  if (!query || query.trim().length === 0) return text

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export function ResultElement({
  item,
  id,
  isActive = false,
  highlightQuery = '',
}: ResultElementProps) {
  return (
    <Link
      id={id}
      href={item.path}
      role="option"
      aria-selected={isActive}
      className={`
        block p-4 rounded-xl 
        backdrop-blur-sm
        transition cursor-pointer
        border
        ${
          isActive
            ? 'bg-primary/10 border-primary/40 ring-2 ring-primary/30'
            : 'bg-base-200/40 border-base-200/30 hover:bg-base-200/70'
        }
      `}
    >
      <div className="font-semibold text-lg">
        <HighlightedText text={item.title} query={highlightQuery} />
      </div>

      {item.description && (
        <div className="text-sm text-gray-400 line-clamp-2">
          <HighlightedText text={item.description} query={highlightQuery} />
        </div>
      )}

      <div className="mt-2">
        {(() => {
          const colorClass =
            SearchTypeColors[item.type.toUpperCase() as keyof typeof SearchTypeColors]
          return (
            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${colorClass}`}
            >
              {item.type.charAt(0).toUpperCase() + item.type.slice(1).toLowerCase()}
            </span>
          )
        })()}
      </div>
    </Link>
  )
}
