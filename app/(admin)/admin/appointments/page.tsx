'use client'
import Table, {
  TableProvider,
  TableHeader,
  TableBody,
  TableFooter,
  ColumnDef,
  ActionButton,
} from '@/components/admin/UI/Forms/DynamicTable'
import { Appointment, AppointmentStatus } from '@/types/features/CalendarTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusBadge = (status: AppointmentStatus) => {
  const styles: Record<AppointmentStatus, string> = {
    PENDING: 'badge-warning',
    BOOKED: 'badge-info',
    COMPLETED: 'badge-success',
    CANCELLED: 'badge-error',
  }
  return (
    <span className={`badge badge-sm ${styles[status] || 'badge-ghost'}`}>
      {status}
    </span>
  )
}

const AppointmentsPage = () => {
  const { t } = useTranslation()
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const columns: ColumnDef<Appointment>[] = [
    {
      key: 'name',
      header: 'admin.appointments.name',
      accessor: (a) => (
        <div className="flex flex-col">
          <span className="font-medium">{a.name}</span>
          <span className="text-xs opacity-70">{a.email}</span>
        </div>
      ),
    },
    {
      key: 'datetime',
      header: 'admin.appointments.datetime',
      accessor: (a) => (
        <div className="flex flex-col">
          <span className="text-sm">{formatDate(a.startTime)}</span>
          <span className="text-xs opacity-70">
            {formatTime(a.startTime)} - {formatTime(a.endTime)}
          </span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'admin.appointments.phone',
      accessor: (a) => <span className="text-sm">{a.phone || '-'}</span>,
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'admin.appointments.status',
      accessor: (a) => statusBadge(a.status),
    },
    {
      key: 'createdAt',
      header: 'admin.appointments.created',
      accessor: (a) => (
        <span className="text-xs text-base-content/60">
          {a.createdAt ? formatDate(a.createdAt) : '-'}
        </span>
      ),
      hideOnMobile: true,
    },
  ]

  const actions: ActionButton<Appointment>[] = [
    {
      label: 'admin.appointments.view',
      onClick: async (a) => {
        setSelectedAppointment(a)
        const modal = document.getElementById('appointment-modal') as HTMLDialogElement
        modal?.showModal()
      },
      className: 'btn-primary',
    },
    {
      label: 'admin.appointments.complete',
      onClick: async (a) => {
        if (a.status !== 'BOOKED') return
        if (!confirm(t('admin.appointments.complete_confirm'))) return
        await axiosInstance.patch(`/api/appointments/${a.appointmentId}`, { status: 'COMPLETED' })
      },
      className: 'btn-success',
      hideOnMobile: true,
      hidden: (a) => a.status !== 'BOOKED',
    },
    {
      label: 'admin.appointments.cancel',
      onClick: async (a) => {
        if (a.status === 'CANCELLED' || a.status === 'COMPLETED') return
        if (!confirm(t('admin.appointments.cancel_confirm'))) return
        await axiosInstance.patch(`/api/appointments/${a.appointmentId}`, { status: 'CANCELLED' })
      },
      className: 'btn-error',
      hideOnMobile: true,
      hidden: (a) => a.status === 'CANCELLED' || a.status === 'COMPLETED',
    },
  ]

  const StatusFilter = () => (
    <select
      className="select select-bordered w-32"
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
    >
      <option value="ALL">{t('admin.appointments.all_statuses')}</option>
      <option value="PENDING">{t('admin.appointments.status_pending')}</option>
      <option value="BOOKED">{t('admin.appointments.status_booked')}</option>
      <option value="COMPLETED">{t('admin.appointments.status_completed')}</option>
      <option value="CANCELLED">{t('admin.appointments.status_cancelled')}</option>
    </select>
  )

  return (
    <>
      <TableProvider<Appointment>
        apiEndpoint="/api/appointments"
        dataKey="appointments"
        idKey="appointmentId"
        columns={columns}
        actions={actions}
        additionalParams={statusFilter !== 'ALL' ? { status: statusFilter } : {}}
      >
        <Table>
          <TableHeader
            title="admin.appointments.title"
            searchPlaceholder="admin.appointments.search_placeholder"
            toolbarContent={<StatusFilter />}
          />
          <TableBody />
          <TableFooter
            showingText="admin.appointments.showing"
            previousText="admin.appointments.previous"
            nextText="admin.appointments.next"
          />
        </Table>
      </TableProvider>

      {/* Modal for viewing appointment details */}
      <dialog id="appointment-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">{t('admin.appointments.details')}</h3>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-base-content/60">
                    {t('admin.appointments.name')}
                  </label>
                  <p className="text-sm">{selectedAppointment.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-base-content/60">
                    {t('admin.appointments.status')}
                  </label>
                  <p>{statusBadge(selectedAppointment.status)}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-base-content/60">
                  {t('admin.appointments.email')}
                </label>
                <p className="text-sm">{selectedAppointment.email}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-base-content/60">
                  {t('admin.appointments.phone')}
                </label>
                <p className="text-sm">{selectedAppointment.phone || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-base-content/60">
                    {t('admin.appointments.date')}
                  </label>
                  <p className="text-sm">{formatDate(selectedAppointment.startTime)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-base-content/60">
                    {t('admin.appointments.time')}
                  </label>
                  <p className="text-sm">
                    {formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}
                  </p>
                </div>
              </div>
              {selectedAppointment.note && (
                <div>
                  <label className="text-xs font-medium text-base-content/60">
                    {t('admin.appointments.note')}
                  </label>
                  <p className="text-sm whitespace-pre-wrap">{selectedAppointment.note}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-base-content/60">
                  {t('admin.appointments.created')}
                </label>
                <p className="text-sm">
                  {selectedAppointment.createdAt ? formatDate(selectedAppointment.createdAt) : '-'}
                </p>
              </div>
            </div>
          )}
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">{t('admin.appointments.close')}</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  )
}

export default AppointmentsPage
