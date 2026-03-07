import { useTranslation } from 'react-i18next'
import { faBriefcase, faUniversity } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const TimelineItems = () => {
  const { t } = useTranslation()
  return (
    <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical pt-2">
      <li>
        <div className="timeline-middle bg-base-300 p-2 rounded-full">
          <FontAwesomeIcon icon={faBriefcase} className="h-5 w-5" />
        </div>
        <div className="timeline-start mb-10 md:text-end me-3 ps-3">
          <time className="font-mono italic">{t('pages.timeline.items.roltek_period')}</time>
          <div className="text-lg font-black">
            {t('pages.timeline.items.roltek_title')} <span className="text-sm italic font-normal">{t('pages.timeline.at')}</span> {t('pages.timeline.items.roltek_company')}
          </div>
          <span className="text-sm max-w-2xl whitespace-pre-line">
            {t('pages.timeline.items.roltek_desc')}
          </span>
        </div>
        <hr />
      </li>
      <li>
        <hr />
        <div className="timeline-middle bg-base-300 p-2 rounded-full">
          <FontAwesomeIcon icon={faBriefcase} className="h-5 w-5" />
        </div>
        <div className="timeline-end mb-10 ml-3">
          <time className="font-mono italic">{t('pages.timeline.items.kuray_yapi_period')}</time>
          <div className="text-lg font-black">
            {t('pages.timeline.items.kuray_yapi_title')} <span className="text-sm italic font-normal">{t('pages.timeline.at')}</span> {t('pages.timeline.items.kuray_yapi_company')}
          </div>
          <span className="text-sm whitespace-pre-line">
            {t('pages.timeline.items.kuray_yapi_desc')}
          </span>
        </div>
        <hr />
      </li>
      <li>
        <hr />
        <div className="timeline-middle bg-base-300 p-2 rounded-full">
          <FontAwesomeIcon icon={faBriefcase} className="h-5 w-5" />
        </div>
        <div className="timeline-start mb-10 md:text-end pl-3">
          <time className="font-mono italic">{t('pages.timeline.items.cadbim_period')}</time>
          <div className="text-lg font-black">
            {t('pages.timeline.items.cadbim_title')} <span className="text-sm italic font-normal">{t('pages.timeline.at')}</span> {t('pages.timeline.items.cadbim_company')}
          </div>
          <span className="text-sm whitespace-pre-line">
            {t('pages.timeline.items.cadbim_desc')}
          </span>
        </div>
        <hr />
      </li>
      <li>
        <hr />
        <div className="timeline-middle bg-base-300 p-2 rounded-full">
          <FontAwesomeIcon icon={faUniversity} className="h-5 w-5" />
        </div>
        <div className="timeline-end mb-10 ml-3">
          <time className="font-mono italic">{t('pages.timeline.items.deu_period')}</time>
          <div className="text-lg font-black">
            {t('pages.timeline.items.deu_title')} <span className="text-sm italic font-normal">{t('pages.timeline.at')}</span> {t('pages.timeline.items.deu_company')}
          </div>
        </div>
      </li>
    </ul>
  )
}

export default TimelineItems
