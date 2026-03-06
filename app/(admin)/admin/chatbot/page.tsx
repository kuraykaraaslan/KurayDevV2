'use client'

import { useState, useMemo } from 'react'
import Table, {
  TableProvider,
  TableHeader,
  TableBody,
  TableFooter,
  ColumnDef,
  ActionButton,
} from '@/components/admin/UI/Forms/DynamicTable'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faUserShield,
  faCircle,
  faLock,
} from '@fortawesome/free-solid-svg-icons'
import type { StoredChatSession } from '@/dtos/ChatbotDTO'

const statusConfig = {
  ACTIVE: { label: 'Active', class: 'badge-success', icon: faCircle },
  TAKEN_OVER: { label: 'Taken Over', class: 'badge-warning', icon: faUserShield },
  CLOSED: { label: 'Closed', class: 'badge-error', icon: faLock },
}

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ChatSessionsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>('')

  const columns: ColumnDef<StoredChatSession>[] = [
    {
      key: 'user',
      header: 'User',
      accessor: (s) => (
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faUser} className="w-3 h-3 text-base-content/50" />
          <div>
            <span className="text-sm font-medium">{s.userEmail ?? 'Unknown'}</span>
            <span className="block text-xs text-base-content/50">{s.userId.slice(0, 12)}...</span>
          </div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Topic',
      accessor: (s) => (
        <span className="text-sm line-clamp-1 max-w-[200px]" title={s.title}>
          {s.title || 'No title'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (s) => {
        const cfg = statusConfig[s.status]
        return (
          <span className={`badge badge-sm ${cfg.class} gap-1`}>
            <FontAwesomeIcon icon={cfg.icon} className="w-2 h-2" />
            {cfg.label}
          </span>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'Started',
      accessor: (s) => <span className="text-xs text-base-content/60">{formatDate(s.createdAt)}</span>,
      hideOnMobile: true,
    },
    {
      key: 'updatedAt',
      header: 'Last Activity',
      accessor: (s) => <span className="text-xs text-base-content/60">{formatDate(s.updatedAt)}</span>,
      hideOnMobile: true,
    },
  ]

  const actions: ActionButton<StoredChatSession>[] = [
    {
      label: 'View',
      href: (s) => `/admin/chatbot/${s.chatSessionId}`,
      className: 'btn-primary',
    },
  ]

  const additionalParams = useMemo(() => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    return params
  }, [statusFilter])

  const statusFilterButtons = (
    <div className="flex gap-1 flex-wrap">
      {['', 'ACTIVE', 'TAKEN_OVER', 'CLOSED'].map((s) => (
        <button
          key={s}
          onClick={() => setStatusFilter(s)}
          className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
        >
          {s === '' ? 'All' : statusConfig[s as keyof typeof statusConfig]?.label ?? s}
        </button>
      ))}
    </div>
  )

  return (
    <TableProvider<StoredChatSession>
      apiEndpoint="/api/chatbot/admin"
      dataKey="sessions"
      idKey="chatSessionId"
      columns={columns}
      actions={actions}
      pageSize={20}
      additionalParams={additionalParams}
    >
      <Table>
        <TableHeader
          title="Chat Sessions"
          showRefresh
          toolbarContent={statusFilterButtons}
          toolbarPosition="below"
        />
        <TableBody emptyText="No chat sessions found" />
        <TableFooter />
      </Table>
    </TableProvider>
  )
}

export default ChatSessionsPage
