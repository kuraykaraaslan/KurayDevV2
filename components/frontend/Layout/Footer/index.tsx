'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXTwitter, faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons'
import { faEnvelope, faBriefcase, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import Link from '@/libs/i18n/Link'
import { useTranslation } from 'react-i18next'
import SystemStatusButton from '../../UI/Buttons/SystemStatusButton'
import GeoHeatmapButton from '../../UI/Buttons/GeoHeatmapButton'
import Logo from '@/components/common/Layout/Logo'

const SOCIAL_LINKS = [
  { href: 'https://twitter.com/kuraykaraaslan', icon: faXTwitter, ariaKey: 'footer.x_profile' },
  { href: 'https://github.com/kuraykaraaslan', icon: faGithub, ariaKey: 'footer.github_profile' },
  { href: 'https://www.linkedin.com/in/kuraykaraaslan/', icon: faLinkedin, ariaKey: 'footer.linkedin_profile' },
] as const

const NAV_LINKS = [
  { href: '/', labelKey: 'navigation.home' },
  { href: '/blog', labelKey: 'navigation.blog' },
  { href: '/#portfolio', labelKey: 'navigation.portfolio' },
  { href: '/#contact', labelKey: 'navigation.contact' },
] as const

const Footer = () => {
  const { t } = useTranslation()

  return (
    <footer
      role="contentinfo"
      aria-label={t('footer.site_footer')}
      className="bg-base-300 text-base-content"
    >
      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Brand column */}
        <div className="flex flex-col gap-4">
          <Logo
            className="btn btn-ghost hover:bg-transparent active:bg-transparent focus:bg-transparent self-start px-0"
          />
          <p className="text-sm text-base-content/60 leading-relaxed max-w-xs">
            {t('footer.tagline')}
          </p>
          <nav aria-label={t('footer.social_media_links')} className="flex flex-row gap-1">
            {SOCIAL_LINKS.map(({ href, icon, ariaKey }) => (
              <Link
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(ariaKey)}
                className="btn btn-ghost btn-sm btn-square"
              >
                <FontAwesomeIcon icon={icon} className="w-4 h-4" aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>

        {/* Quick links column */}
        <nav aria-label={t('footer.quick_links')}>
          <h3 className="font-semibold text-xs uppercase tracking-widest text-base-content/40 mb-4">
            {t('footer.quick_links')}
          </h3>
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map(({ href, labelKey }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-base-content/70 hover:text-base-content transition-colors"
                >
                  {t(labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Connect column */}
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-widest text-base-content/40 mb-4">
            {t('footer.connect')}
          </h3>
          <ul className="flex flex-col gap-3">
            <li>
              <Link
                href="mailto:kuraykaraaslan@gmail.com"
                className="flex items-center gap-2 text-sm text-base-content/70 hover:text-base-content transition-colors"
              >
                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 shrink-0" aria-hidden="true" />
                kuraykaraaslan@gmail.com
              </Link>
            </li>
            <li>
              <Link
                href="https://github.com/kuraykaraaslan"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('footer.github_profile')}
                className="flex items-center gap-2 text-sm text-base-content/70 hover:text-base-content transition-colors"
              >
                <FontAwesomeIcon icon={faGithub} className="w-4 h-4 shrink-0" aria-hidden="true" />
                github.com/kuraykaraaslan
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3 opacity-40" aria-hidden="true" />
              </Link>
            </li>
            <li>
              <Link
                href="https://www.linkedin.com/in/kuraykaraaslan/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('footer.linkedin_profile')}
                className="flex items-center gap-2 text-sm text-base-content/70 hover:text-base-content transition-colors"
              >
                <FontAwesomeIcon icon={faLinkedin} className="w-4 h-4 shrink-0" aria-hidden="true" />
                linkedin.com/in/kuraykaraaslan
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3 opacity-40" aria-hidden="true" />
              </Link>
            </li>
            <li>
              <Link
                href="/#contact"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-colors"
              >
                <FontAwesomeIcon icon={faBriefcase} className="w-4 h-4 shrink-0" aria-hidden="true" />
                {t('footer.available_for_freelance')}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────── */}
      <div className="border-t border-base-content/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 flex-wrap">
          <span className="text-xs text-base-content/40 select-all">
            © {new Date().getFullYear()} Kuray Karaaslan.&nbsp;{t('shared.footer.all_rights_reserved')}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-base-content/30">{t('footer.built_with')}</span>
            <SystemStatusButton />
            <GeoHeatmapButton />
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
