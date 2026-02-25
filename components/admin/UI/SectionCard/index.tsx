import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export interface SectionCardProps {
  icon: IconDefinition
  title: string
  description: string
  children: React.ReactNode
  className?: string
}

const SectionCard = ({ icon, title, description, children, className = '' }: SectionCardProps) => (
  <div className={`bg-base-100 rounded-xl p-5 shadow-sm border border-base-300 ${className}`}>
    <div className="flex items-start gap-3 mb-4">
      <div className="bg-primary/10 text-primary rounded-lg p-2 mt-0.5">
        <FontAwesomeIcon icon={icon} className="w-4 h-4" />
      </div>
      <div>
        <h3 className="font-semibold text-base-content">{title}</h3>
        <p className="text-xs text-base-content/50 mt-0.5">{description}</p>
      </div>
    </div>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
)

export default SectionCard
