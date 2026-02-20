'use client'
import Table, {
  TableProvider,
  TableHeader,
  TableBody,
  TableFooter,
  ColumnDef,
  ActionButton,
} from '@/components/admin/UI/Forms/DynamicTable'
import { ContactForm } from '@/types/features/ContactTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ContactsPage = () => {
  const { t } = useTranslation()

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
      onClick: async (c) => {
        const modal = document.getElementById('contact-modal') as HTMLDialogElement
        if (modal) {
          const content = document.getElementById('contact-modal-content')
          if (content) {
            content.innerHTML = `
              <div class="space-y-4">
                <div>
                  <label class="text-xs font-medium text-base-content/60">${t('admin.contacts.name')}</label>
                  <p class="text-sm">${c.name}</p>
                </div>
                <div>
                  <label class="text-xs font-medium text-base-content/60">${t('admin.contacts.email')}</label>
                  <p class="text-sm">${c.email}</p>
                </div>
                ${c.phone ? `
                <div>
                  <label class="text-xs font-medium text-base-content/60">${t('admin.contacts.phone')}</label>
                  <p class="text-sm">${c.phone}</p>
                </div>
                ` : ''}
                <div>
                  <label class="text-xs font-medium text-base-content/60">${t('admin.contacts.message')}</label>
                  <p class="text-sm whitespace-pre-wrap">${c.message}</p>
                </div>
                <div>
                  <label class="text-xs font-medium text-base-content/60">${t('admin.contacts.date')}</label>
                  <p class="text-sm">${c.createdAt ? formatDate(c.createdAt) : '-'}</p>
                </div>
              </div>
            `
          }
          modal.showModal()
        }
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
      <dialog id="contact-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">{t('admin.contacts.contact_details')}</h3>
          <div id="contact-modal-content"></div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">{t('admin.contacts.close')}</button>
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

export default ContactsPage
