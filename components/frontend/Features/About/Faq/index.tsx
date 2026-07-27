'use client'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

type FaqGroup = {
  key: 'identity' | 'stack' | 'bim' | 'iot' | 'services' | 'writing'
  itemKeys: string[]
}

const groups: FaqGroup[] = [
  { key: 'identity', itemKeys: ['who', 'role', 'bim', 'iot', 'construction'] },
  {
    key: 'stack',
    itemKeys: [
      'tech_stack',
      'mobile',
      'database',
      'multitenant',
      'architecture',
      'rest_apis',
      'auth_systems',
      'admin_panels',
      'fullstack',
      'appointment_systems',
      'software_contact',
    ],
  },
  { key: 'bim', itemKeys: ['bim_tools', 'bim_automation_explain', 'bim_custom_tools', 'bim_contact'] },
  {
    key: 'iot',
    itemKeys: [
      'iot_protocols',
      'iot_focus',
      'iot_dashboards',
      'iot_device_management',
      'iot_geospatial',
      'iot_contact',
    ],
  },
  { key: 'services', itemKeys: ['availability', 'clients', 'reviews', 'mvp', 'contact'] },
  { key: 'writing', itemKeys: ['topics', 'tone'] },
]

const allItemKeys = groups.flatMap((group) => group.itemKeys)

const Faq = () => {
  const { t } = useTranslation()

  return (
    <div className="bg-base-100 min-h-screen py-24">
      <div className="px-4 mx-auto max-w-screen-md lg:px-6">
        <div className="mx-auto max-w-screen-sm text-center mb-16">
          <h1 className="mb-4 font-bold text-fluid-hero">{t('pages.about.faq_title')}</h1>
          <p className="font-light sm:text-xl opacity-80">{t('pages.about.faq_subtitle')}</p>
        </div>

        {groups.map((group) => (
          <div key={group.key} className="mb-12 last:mb-0">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] opacity-50">
              {t(`pages.about.faq_groups.${group.key}`)}
            </h2>
            <div className="divide-y divide-base-content/10 border-t border-base-content/10">
              {group.itemKeys.map((itemKey) => {
                const index = allItemKeys.indexOf(itemKey) + 1
                return (
                  <details key={itemKey} className="group py-6">
                    <summary className="flex cursor-pointer list-none items-start gap-4 [&::-webkit-details-marker]:hidden">
                      <span className="font-mono text-sm opacity-40">{String(index).padStart(2, '0')}</span>
                      <span className="flex-1 font-semibold">
                        {t(`pages.about.faq_items.${itemKey}.question`)}
                      </span>
                      <FontAwesomeIcon
                        icon={faPlus}
                        className="mt-1 w-3 h-3 shrink-0 opacity-50 transition-transform duration-300 group-open:rotate-45"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="mt-4 pl-9 text-sm leading-relaxed opacity-80">
                      {t(`pages.about.faq_items.${itemKey}.answer`)}
                    </p>
                  </details>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Faq
