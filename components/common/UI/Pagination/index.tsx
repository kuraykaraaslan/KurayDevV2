'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter, useSearchParams } from 'next/navigation'

type PaginationSize = 'sm' | 'md' | 'lg'

interface PaginationProps {
  totalPages: number
  currentPage?: number
  onPageChange?: (page: number) => void
  syncUrl?: boolean
  urlParam?: string
  delta?: number
  minWindow?: number
  showFirstLast?: boolean
  showPrevNext?: boolean
  showJumpTo?: boolean
  size?: PaginationSize
  compact?: boolean
}

interface PaginationCoreProps {
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  delta: number
  minWindow: number
  showFirstLast: boolean
  showPrevNext: boolean
  showJumpTo: boolean
  size: PaginationSize
  compact: boolean
}

const sizeClass: Record<PaginationSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

function PaginationCore({
  totalPages,
  currentPage,
  onPageChange,
  delta,
  minWindow,
  showFirstLast,
  showPrevNext,
  showJumpTo,
  size,
  compact,
}: PaginationCoreProps) {
  const { t } = useTranslation()
  const [jumpValue, setJumpValue] = useState('')

  if (totalPages <= 1) return null

  const btnClass = `join-item btn ${sizeClass[size]}`

  if (compact) {
    return (
      <div className="flex justify-center mb-6">
        <div className="join">
          <button
            className={btnClass}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label={t('common.pagination.previous_page')}
            title={t('common.pagination.previous_page')}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button className={`${btnClass} pointer-events-none min-w-16 tabular-nums`}>
            {currentPage} / {totalPages}
          </button>
          <button
            className={btnClass}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label={t('common.pagination.next_page')}
            title={t('common.pagination.next_page')}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    )
  }

  let rangeStart = Math.max(1, currentPage - delta)
  let rangeEnd = Math.min(totalPages, currentPage + delta)

  if (totalPages >= minWindow && rangeEnd - rangeStart + 1 < minWindow) {
    if (rangeStart === 1) {
      rangeEnd = Math.min(totalPages, rangeStart + minWindow - 1)
    } else {
      rangeStart = Math.max(1, rangeEnd - minWindow + 1)
    }
  }

  const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = []
  if (rangeStart > 1) pages.push('ellipsis-start')
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)
  if (rangeEnd < totalPages) pages.push('ellipsis-end')

  function handleJump() {
    const page = parseInt(jumpValue)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page)
      setJumpValue('')
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      <div className="join">
        {showFirstLast && (
          <button
            className={btnClass}
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            aria-label={t('common.pagination.first_page')}
            title={t('common.pagination.first_page')}
          >
            <FontAwesomeIcon icon={faAnglesLeft} />
          </button>
        )}
        {showPrevNext && (
          <button
            className={btnClass}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label={t('common.pagination.previous_page')}
            title={t('common.pagination.previous_page')}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
        )}
        {pages.map((p) =>
          p === 'ellipsis-start' || p === 'ellipsis-end' ? (
            <button key={p} className={`${btnClass} btn-disabled hidden sm:flex`} aria-hidden>…</button>
          ) : (
            <button
              key={p}
              className={`${btnClass} ${p === currentPage ? 'btn-primary' : ''}`}
              onClick={() => onPageChange(p)}
              aria-label={
                p === currentPage
                  ? t('common.pagination.current_page', { page: p })
                  : t('common.pagination.page', { page: p })
              }
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        {showPrevNext && (
          <button
            className={btnClass}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label={t('common.pagination.next_page')}
            title={t('common.pagination.next_page')}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        )}
        {showFirstLast && (
          <button
            className={btnClass}
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            aria-label={t('common.pagination.last_page')}
            title={t('common.pagination.last_page')}
          >
            <FontAwesomeIcon icon={faAnglesRight} />
          </button>
        )}
      </div>
      {showJumpTo && (
        <div className="join">
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJump()}
            placeholder={`1 – ${totalPages}`}
            aria-label={t('common.pagination.go_to_page')}
            className={`join-item input input-bordered w-24 text-center ${size === 'sm' ? 'input-sm' : size === 'lg' ? 'input-lg' : ''}`}
          />
          <button className={btnClass} onClick={handleJump}>
            {t('common.pagination.go')}
          </button>
        </div>
      )}
    </div>
  )
}

function PaginationWithUrl(props: Omit<PaginationCoreProps, 'currentPage' | 'onPageChange'> & {
  onPageChange?: (page: number) => void
  urlParam: string
}) {
  const { urlParam, onPageChange, ...rest } = props
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentPage = Math.max(1, parseInt(searchParams.get(urlParam) || '1', 10))

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(urlParam, String(page))
    router.push(`?${params.toString()}`)
    onPageChange?.(page)
  }

  return <PaginationCore {...rest} currentPage={currentPage} onPageChange={handlePageChange} />
}

export default function Pagination({
  totalPages,
  currentPage,
  onPageChange,
  syncUrl = false,
  urlParam = 'page',
  delta = 1,
  minWindow = 3,
  showFirstLast = true,
  showPrevNext = true,
  showJumpTo = false,
  size = 'md',
  compact = false,
}: PaginationProps) {
  const coreProps = { totalPages, delta, minWindow, showFirstLast, showPrevNext, showJumpTo, size, compact }

  if (syncUrl) {
    return <PaginationWithUrl {...coreProps} urlParam={urlParam} onPageChange={onPageChange} />
  }

  return (
    <PaginationCore
      {...coreProps}
      currentPage={currentPage ?? 1}
      onPageChange={onPageChange ?? (() => {})}
    />
  )
}
