import type { SortState } from './types'

interface SortIconProps {
  colKey: string
  sort: SortState
}

function SortIcon({ colKey, sort }: SortIconProps) {
  const isActive = sort?.key === colKey
  const dir = isActive ? sort!.dir : null
  return (
    <span className="inline-flex flex-col gap-[1px] ml-1 opacity-50 group-hover:opacity-100 transition-opacity">
      <svg
        width="8"
        height="5"
        viewBox="0 0 8 5"
        className={isActive && dir === 'asc' ? 'opacity-100' : 'opacity-30'}
      >
        <path d="M4 0L8 5H0L4 0Z" fill="currentColor" />
      </svg>
      <svg
        width="8"
        height="5"
        viewBox="0 0 8 5"
        className={isActive && dir === 'desc' ? 'opacity-100' : 'opacity-30'}
      >
        <path d="M4 5L0 0H8L4 5Z" fill="currentColor" />
      </svg>
    </span>
  )
}

export default SortIcon
