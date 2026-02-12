import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/free-solid-svg-icons'

const StatCard = ({
  icon,
  title,
  value,
  description,
}: {
  icon: IconDefinition
  title: string
  value: any
  description: string
}) => {
  return (
    <div className="flex items-center p-4 bg-base-200 rounded-lg shadow-md h-32 min-w-60">
      <div className="flex-shrink-0 w-12 h-12 bg-primary text-base-100 rounded-full flex items-center justify-center">
        <FontAwesomeIcon icon={icon} width={24} height={24} />
      </div>
      <div className="ml-4">
        <h4 className="text-lg font-medium">{title}</h4>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm">{description}</p>
      </div>
    </div>
  )
}

export default StatCard
