'use client'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faCompass, faHammer, faLayerGroup, type IconDefinition } from '@fortawesome/free-solid-svg-icons'
import Link from '@/libs/i18n/Link'

type EngagementMode = {
  key: 'advisory' | 'build' | 'platform'
  icon: IconDefinition
  accent: string
}

const modes: EngagementMode[] = [
  { key: 'advisory', icon: faCompass, accent: 'cyan-700' },
  { key: 'build', icon: faHammer, accent: 'violet-700' },
  { key: 'platform', icon: faLayerGroup, accent: 'emerald-700' },
]

const accentClasses: Record<string, { border: string; badgeBg: string; badgeText: string }> = {
  'cyan-700': { border: 'border-t-cyan-700', badgeBg: 'bg-cyan-700/10', badgeText: 'text-cyan-700' },
  'violet-700': { border: 'border-t-violet-700', badgeBg: 'bg-violet-700/10', badgeText: 'text-violet-700' },
  'emerald-700': { border: 'border-t-emerald-700', badgeBg: 'bg-emerald-700/10', badgeText: 'text-emerald-700' },
}

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
            const accent = accentClasses[mode.accent]
            return (
              <div
                key={mode.key}
                className={`rounded-none border border-base-300 bg-base-100 shadow-lg border-t-4 ${accent.border} p-8`}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full ${accent.badgeBg} ${accent.badgeText}`}
                >
                  <FontAwesomeIcon icon={mode.icon} className="text-xl" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-xl font-bold">
                  {t(`pages.freelance.engagement.${mode.key}_title`)}
                </h3>
                <p className="mt-2 text-sm opacity-80">
                  {t(`pages.freelance.engagement.${mode.key}_description`)}
                </p>
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
