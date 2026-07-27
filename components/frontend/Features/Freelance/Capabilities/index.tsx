'use client'
import { useTranslation } from 'react-i18next'
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
import SingleSkill from '@/components/frontend/Features/Hero/Toolbox/Partials/SingleSkill'

type CapabilityGroup = {
  key: 'foundations' | 'backend' | 'delivery'
  border: string
  bgColor: string
  skills: { key: string; icon: IconDefinition }[]
}

const groups: CapabilityGroup[] = [
  {
    key: 'foundations',
    border: 'border-t-cyan-700',
    bgColor: 'bg-cyan-700',
    skills: [
      { key: 'clean_code', icon: faCode },
      { key: 'authentication_security', icon: faKey },
    ],
  },
  {
    key: 'backend',
    border: 'border-t-violet-700',
    bgColor: 'bg-violet-700',
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
    border: 'border-t-emerald-700',
    bgColor: 'bg-emerald-700',
    skills: [
      { key: 'testing_cicd', icon: faVial },
      { key: 'performance_optimization', icon: faRocket },
      { key: 'cloud_infrastructure', icon: faCloud },
      { key: 'event_driven_architecture', icon: faStream },
      { key: 'domain_driven_design', icon: faArchway },
    ],
  },
]

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
          {groups.map((group) => (
            <div
              key={group.key}
              className={`rounded-none border border-base-300 bg-base-200/40 shadow-lg border-t-4 ${group.border} p-6`}
            >
              <h3 className="mb-5 text-sm font-bold uppercase tracking-wider">
                {t(`pages.freelance.capabilities_groups.${group.key}`)}
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {group.skills.map((skill) => (
                  <SingleSkill
                    key={skill.key}
                    icon={skill.icon}
                    title={t(`pages.toolbox.skills.${skill.key}`)}
                    bgColor={group.bgColor}
                    textColor="text-white"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Capabilities
