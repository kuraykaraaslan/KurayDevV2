import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons'
import { ContactForm } from '@/types/features/ContactTypes'

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function ContactFormItem({ contact }: { contact: ContactForm }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <div className="p-2 rounded-full bg-warning/10 flex-shrink-0">
        <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3 text-warning" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-medium text-base-content/80 truncate">{contact.name}</span>
          <span className="text-xs text-base-content/40 flex-shrink-0">
            {contact.createdAt ? formatDate(contact.createdAt) : ''}
          </span>
        </div>
        <p className="text-xs text-base-content/50 truncate">{contact.message}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-base-content/40 truncate">{contact.email}</span>
          {contact.phone && (
            <span className="text-xs text-base-content/40 flex items-center gap-1">
              <FontAwesomeIcon icon={faPhone} className="w-2.5 h-2.5" />
              {contact.phone}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
