'use client'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArchway,
  faCode,
  faCogs,
  faCloud,
  faDatabase,
  faKey,
  faMoneyBill,
  faProjectDiagram,
  faRocket,
  faServer,
  faStream,
  faVial,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons'

type CapabilityGroup = {
  key: 'foundations' | 'backend' | 'delivery'
  accent: string
  skills: { key: string; icon: IconDefinition }[]
}

const groups: CapabilityGroup[] = [
  {
    key: 'foundations',
    accent: 'cyan-700',
    skills: [
      { key: 'clean_code', icon: faCode },
      { key: 'authentication_security', icon: faKey },
    ],
  },
  {
    key: 'backend',
    accent: 'violet-700',
    skills: [
      { key: 'rest_api_design', icon: faCogs },
      { key: 'sql_data_modeling', icon: faDatabase },
      { key: 'multi_tenant_saas', icon: faProjectDiagram },
      { key: 'caching_redis', icon: faServer },
      { key: 'payment_systems', icon: faMoneyBill },
    ],
  },
  {
    key: 'delivery',
    accent: 'emerald-700',
    skills: [
      { key: 'testing_cicd', icon: faVial },
      { key: 'performance_optimization', icon: faRocket },
      { key: 'cloud_infrastructure', icon: faCloud },
      { key: 'event_driven_architecture', icon: faStream },
      { key: 'domain_driven_design', icon: faArchway },
    ],
  },
]

const accentClasses: Record<string, { border: string; badgeBg: string; badgeText: string }> = {
  'cyan-700': { border: 'border-t-cyan-700', badgeBg: 'bg-cyan-700/10', badgeText: 'text-cyan-700' },
  'violet-700': { border: 'border-t-violet-700', badgeBg: 'bg-violet-700/10', badgeText: 'text-violet-700' },
  'emerald-700': { border: 'border-t-emerald-700', badgeBg: 'bg-emerald-700/10', badgeText: 'text-emerald-700' },
}

const Capabilities = () => {
  const { t } = useTranslation()

  return (
    <section className="bg-base-100 py-16" id="capabilities">
      <div className="px-4 mx-auto max-w-screen-xl lg:px-6">
        <div className="mx-auto max-w-screen-sm text-center mb-12">
          <h2 className="mb-4 text-fluid-section tracking-tight font-extrabold">
            {t('pages.freelance.capabilities_title')}
          </h2>
          <p className="font-light sm:text-xl opacity-80">
            {t('pages.freelance.capabilities_subtitle')}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {groups.map((group) => {
            const accent = accentClasses[group.accent]
            return (
              <div
                key={group.key}
                className={`rounded-none border border-base-300 bg-base-100 shadow-lg border-t-4 ${accent.border}`}
              >
                <div className="p-6">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wider">
                    {t(`pages.freelance.capabilities_groups.${group.key}`)}
                  </h3>
                  <ul>
                    {group.skills.map((skill) => (
                      <li
                        key={skill.key}
                        className="flex items-center gap-3 border-b border-base-300 py-3 last:border-none"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${accent.badgeBg} ${accent.badgeText}`}
                        >
                          <FontAwesomeIcon icon={skill.icon} className="text-sm" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-medium">
                          {t(`pages.toolbox.skills.${skill.key}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Capabilities
