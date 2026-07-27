'use client'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faCompass, faHammer, faLayerGroup, type IconDefinition } from '@fortawesome/free-solid-svg-icons'
import Link from '@/libs/i18n/Link'

type EngagementMode = {
  key: 'advisory' | 'build' | 'platform'
  icon: IconDefinition
  border: string
  badgeBg: string
  badgeText: string
  backBg: string
}

const modes: EngagementMode[] = [
  {
    key: 'advisory',
    icon: faCompass,
    border: 'border-t-cyan-700',
    badgeBg: 'bg-cyan-700/10',
    badgeText: 'text-cyan-700',
    backBg: 'bg-cyan-700',
  },
  {
    key: 'build',
    icon: faHammer,
    border: 'border-t-violet-700',
    badgeBg: 'bg-violet-700/10',
    badgeText: 'text-violet-700',
    backBg: 'bg-violet-700',
  },
  {
    key: 'platform',
    icon: faLayerGroup,
    border: 'border-t-emerald-700',
    badgeBg: 'bg-emerald-700/10',
    badgeText: 'text-emerald-700',
    backBg: 'bg-emerald-700',
  },
]

const Engagement = () => {
  const { t } = useTranslation()

  return (
    <section className="bg-base-300 py-16">
      <div className="px-4 mx-auto max-w-screen-xl lg:px-6">
        <div className="mx-auto max-w-screen-md text-center mb-12">
          <h2 className="mb-4 text-fluid-section tracking-tight font-extrabold">
            {t('pages.freelance.engagement.title')}
          </h2>
          <p className="font-light sm:text-xl opacity-80">
            {t('pages.freelance.engagement.description')}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {modes.map((mode) => {
            const title = t(`pages.freelance.engagement.${mode.key}_title`)
            const description = t(`pages.freelance.engagement.${mode.key}_description`)
            return (
              <div key={mode.key} className="group h-64 [perspective:1000px]">
                <div
                  className={`relative h-full w-full rounded-none border border-base-300 shadow-lg transition duration-500 transform group-hover:rotate-y-180 border-t-4 ${mode.border}`}
                >
                  {/* front */}
                  <div className="flex h-full flex-col items-center justify-center gap-4 bg-base-100 p-8 text-center group-hover:hidden">
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-full ${mode.badgeBg} ${mode.badgeText}`}
                    >
                      <FontAwesomeIcon icon={mode.icon} className="text-xl" aria-hidden="true" />
                    </span>
                    <h3 className="text-xl font-bold">{title}</h3>
                  </div>

                  {/* back */}
                  <div
                    className={`absolute inset-0 hidden rotate-y-180 flex-col items-center justify-center gap-3 p-8 text-center text-white group-hover:flex ${mode.backBg}`}
                  >
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="text-sm">{description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Link href="#contact" className="btn btn-primary">
            {t('pages.freelance.engagement.cta')}
            <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Engagement
