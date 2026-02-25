'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXTwitter, faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons'

import Link from '@/libs/i18n/Link'
import { useTranslation } from 'react-i18next'
import SystemStatusButton from '../../UI/Buttons/SystemStatusButton'

const Footer = () => {
  const { t } = useTranslation()

  return (
    <footer
      role="contentinfo"
      aria-label="Site footer"
      className="footer flex flex-col md:flex-row md:justify-between items-center bg-base-300 text-base-content p-2"
    >
      <div className="flex flex-row flex-wrap justify-start items-center gap-2">
        <span className="text-sm text-base-content/60 select-all">
          © {new Date().getFullYear()} Kuray Karaaslan. {t('shared.footer.all_rights_reserved')}
        </span>
        <SystemStatusButton />
      </div>

      <nav aria-label="Social media links" className="flex flex-row flex-wrap justify-end gap-1">
        <Link
          href="https://twitter.com/kuraykaraaslan"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X (formerly Twitter) profile (opens in new tab)"
          className="p-2 rounded-lg hover:bg-base-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          <FontAwesomeIcon icon={faXTwitter} style={{ width: '24px', height: '24px' }} aria-hidden="true" />
        </Link>
        <Link
          href="https://github.com/kuraykaraaslan"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub profile (opens in new tab)"
          className="p-2 rounded-lg hover:bg-base-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          <FontAwesomeIcon icon={faGithub} style={{ width: '24px', height: '24px' }} aria-hidden="true" />
        </Link>
        <Link
          href="https://www.linkedin.com/in/kuraykaraaslan/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn profile (opens in new tab)"
          className="p-2 rounded-lg hover:bg-base-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          <FontAwesomeIcon icon={faLinkedin} style={{ width: '24px', height: '24px' }} aria-hidden="true" />
        </Link>
      </nav>
    </footer>
  )
}

export default Footer
