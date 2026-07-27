import { useTranslation } from 'react-i18next'
import { faBriefcase, faUniversity, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

type TimelineEntry = {
  period: string
  title: string
  company: string
  description?: string
}

const ICONS: IconDefinition[] = [faBriefcase, faBriefcase, faBriefcase, faUniversity]

const TimelineItems = () => {
  const { t } = useTranslation()
  const items = t('pages.timeline.items', { returnObjects: true }) as TimelineEntry[]

  return (
    <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical pt-2">
      {items.map((item, index) => {
        const isStart = index % 2 === 0
        const isLast = index === items.length - 1
        return (
          <li key={index}>
            {index > 0 && <hr />}
            <div className="timeline-middle bg-base-300 p-2 rounded-full">
              <FontAwesomeIcon icon={ICONS[index] ?? faBriefcase} className="h-5 w-5" />
            </div>
            <div className={isStart ? 'timeline-start mb-10 md:text-end me-3 ps-3' : 'timeline-end mb-10 ms-3'}>
              <time className="font-mono italic">{item.period}</time>
              <div className="text-lg font-black">
                {item.title} <span className="text-sm italic font-normal">{t('pages.timeline.at')}</span> {item.company}
              </div>
              {item.description && (
                <span className="text-sm whitespace-pre-line">{item.description}</span>
              )}
            </div>
            {!isLast && <hr />}
          </li>
        )
      })}
    </ul>
  )
}

export default TimelineItems
