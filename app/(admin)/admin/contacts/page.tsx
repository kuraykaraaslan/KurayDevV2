'use client'
import { useState } from 'react'
import Table, {
  TableProvider,
  TableHeader,
  TableBody,
  TableFooter,
  ColumnDef,
  ActionButton,
} from '@/components/admin/UI/Forms/DynamicTable'
import HeadlessModal, { useModal } from '@/components/admin/UI/Modal'
import { ContactForm } from '@/types/features/ContactTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import { formatDateTime as formatDate } from '@/helpers/TimeHelper'

const ContactsPage = () => {
  const { t } = useTranslation()
  const { open, openModal, closeModal } = useModal()
  const [selectedContact, setSelectedContact] = useState<ContactForm | null>(null)

  const columns: ColumnDef<ContactForm>[] = [
    {
      key: 'name',
      header: 'admin.contacts.name',
      accessor: (c) => c.name,
    },
    {
      key: 'contact',
      header: 'admin.contacts.contact',
      accessor: (c) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm">{c.email}</span>
          {c.phone && <span className="text-xs opacity-70">{c.phone}</span>}
        </div>
      ),
    },
    {
      key: 'message',
      header: 'admin.contacts.message',
      className: 'max-w-48',
      accessor: (c) => (
        <span className="line-clamp-2 text-sm" title={c.message}>
          {c.message}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'admin.contacts.date',
      accessor: (c) => (
        <span className="text-xs text-base-content/60">
          {c.createdAt ? formatDate(c.createdAt) : '-'}
        </span>
      ),
    },
  ]

  const actions: ActionButton<ContactForm>[] = [
    {
      label: 'admin.contacts.view',
      onClick: (c) => {
        setSelectedContact(c)
        openModal()
      },
      className: 'btn-primary',
    },
    {
      label: 'admin.contacts.reply',
      onClick: (c) => {
        window.location.href = `mailto:${c.email}?subject=Re: Contact Form Submission`
      },
      className: 'btn-info',
      hideOnMobile: true,
    },
    {
      label: 'admin.contacts.delete',
      onClick: async (c) => {
        if (!confirm(t('admin.contacts.confirm_delete'))) return
        await axiosInstance.delete(`/api/contact/form/${c.contactId}`)
      },
      className: 'btn-error',
      hideOnMobile: true,
    },
  ]

  return (
    <>
      <TableProvider<ContactForm>
        apiEndpoint="/api/contact/form"
        dataKey="contactForms"
        idKey="contactId"
        columns={columns}
        actions={actions}
        additionalParams={{ sort: 'desc' }}
      >
        <Table>
          <TableHeader
            title="admin.contacts.title"
            searchPlaceholder="admin.contacts.search_placeholder"
          />
          <TableBody />
          <TableFooter
            showingText="admin.contacts.showing"
            previousText="admin.contacts.previous"
            nextText="admin.contacts.next"
          />
        </Table>
      </TableProvider>

      {/* Modal for viewing contact details */}
      <HeadlessModal
        open={open}
        onClose={closeModal}
        title={t('admin.contacts.contact_details')}
      >
        {selectedContact && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-base-content/60">{t('admin.contacts.name')}</label>
              <p className="text-sm">{selectedContact.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-base-content/60">{t('admin.contacts.email')}</label>
              <p className="text-sm">{selectedContact.email}</p>
            </div>
            {selectedContact.phone && (
              <div>
                <label className="text-xs font-medium text-base-content/60">{t('admin.contacts.phone')}</label>
                <p className="text-sm">{selectedContact.phone}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-base-content/60">{t('admin.contacts.message')}</label>
              <p className="text-sm whitespace-pre-wrap">{selectedContact.message}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-base-content/60">{t('admin.contacts.date')}</label>
              <p className="text-sm">{selectedContact.createdAt ? formatDate(selectedContact.createdAt) : '-'}</p>
            </div>
          </div>
        )}
      </HeadlessModal>
    </>
  )
}

export default ContactsPage
