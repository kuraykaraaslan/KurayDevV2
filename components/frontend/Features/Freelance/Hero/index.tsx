'use client'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faCircleNodes } from '@fortawesome/free-solid-svg-icons'
import Link from '@/libs/i18n/Link'
import dynamic from 'next/dynamic'

// react-svg-worldmap emits tiny floating-point differences between server and
// client renders of its path data, which breaks hydration — render client-only.
const WorldMapDecoration = dynamic(() => import('./Partials/WorldMapDecoration'), { ssr: false })

const Hero = () => {
  const { t } = useTranslation()

  return (
    <div className="relative bg-base-200 min-h-screen overflow-hidden">
      <video
        muted
        loop
        autoPlay
        playsInline
        className="absolute inset-0 z-0 h-full w-full object-cover opacity-20"
        aria-hidden="true"
      >
        <source src="/assets/videos/freelance-welcome.mp4" type="video/mp4" />
      </video>
      <div
        className="absolute inset-0 z-0 bg-gradient-to-b from-base-200/90 via-base-200/60 to-base-200"
        aria-hidden="true"
      />

      <div
        className="hero relative z-10 min-h-screen select-none"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <div className="hero-content">
          <div className="flex-1 max-w-2xl md:me-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <FontAwesomeIcon icon={faCircleNodes} className="w-3 h-3" aria-hidden="true" />
              {t('pages.freelance.hero.eyebrow')}
            </span>

            <h1 className="mt-4 font-bold text-fluid-hero">{t('pages.freelance.hero.title')}</h1>

            <p className="py-4 pb-6 max-w-xl leading-7 text-lg opacity-80">
              {t('pages.freelance.hero.subtitle')}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="#contact" className="btn btn-primary">
                {t('pages.freelance.hero.cta_primary')}
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="/projects" className="btn btn-outline">
                {t('pages.freelance.hero.cta_secondary')}
              </Link>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-base-content/10 bg-base-100/70 px-4 py-2 text-sm backdrop-blur">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
              </span>
              <span>{t('pages.freelance.hero.availability')}</span>
            </div>
          </div>

          <div className="hidden lg:block max-w-md rounded-none bg-primary p-10">
            <WorldMapDecoration />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
