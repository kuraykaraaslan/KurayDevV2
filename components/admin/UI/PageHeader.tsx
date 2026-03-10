'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faRotateRight } from '@fortawesome/free-solid-svg-icons'
import Link from '@/libs/i18n/Link'

interface ActionButton {
  label: string
  onClick?: () => void
  href?: string
  className?: string
  icon?: any
  loading?: boolean
  disabled?: boolean
}

interface PageHeaderProps {
  title: string
  /** Plain string description — rendered as muted paragraph */
  description?: string
  /** Rich content subtitle (ReactNode) */
  subtitle?: React.ReactNode
  backHref?: string
  onBack?: () => void
  onRefresh?: () => void
  refreshing?: boolean
  actions?: ActionButton[]
  className?: string
  children?: React.ReactNode
}

const PageHeader = ({
  title,
  description,
  subtitle,
  backHref,
  onBack,
  onRefresh,
  refreshing = false,
  actions = [],
  className = '',
  children,
}: PageHeaderProps) => {
  const { t } = useTranslation()
  const showBack = onBack || backHref

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showBack && (
        backHref ? (
          <Link href={backHref} className="btn btn-ghost btn-sm shrink-0">
            <FontAwesomeIcon icon={faArrowLeft} />
          </Link>
        ) : (
          <button onClick={onBack} className="btn btn-ghost btn-sm shrink-0">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
        )
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && (
          <div className="mt-0.5 text-sm text-base-content/50 truncate">{subtitle}</div>
        )}
        {!subtitle && description && (
          <p className="text-sm text-base-content/50 mt-0.5">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {children}
        {actions.map((action, i) =>
          action.href ? (
            <Link
              key={i}
              href={action.href}
              className={`btn btn-sm ${action.className ?? 'btn-ghost'}`}
            >
              {action.icon && <FontAwesomeIcon icon={action.icon} />}
              {action.label}
            </Link>
          ) : (
            <button
              key={i}
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
              className={`btn btn-sm ${action.className ?? 'btn-ghost'}`}
            >
              {action.loading && <span className="loading loading-spinner loading-xs" />}
              {!action.loading && action.icon && <FontAwesomeIcon icon={action.icon} />}
              {action.label}
            </button>
          )
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="btn btn-ghost btn-sm"
            title={t('common.refresh')}
          >
            <FontAwesomeIcon icon={faRotateRight} className={refreshing ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
    </div>
  )
}

export default PageHeader

