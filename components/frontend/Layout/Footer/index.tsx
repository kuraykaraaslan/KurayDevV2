'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXTwitter, faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons'

import Link from '@/libs/i18n/Link'
import { useTranslation } from 'react-i18next'
import SystemStatusButton from '../../UI/Buttons/SystemStatusButton'
//import GeoHeatmapButton from "../../UI/Buttons/GeoHeatmapButton";

const Footer = () => {
  const { t } = useTranslation()

  return (
    <>
      <footer className="footer flex flex-col md:flex-row md:justify-between items-center bg-base-300 text-base-content p-2">
        <div className="col-span-1 flex flex-row flex-wrap justify-start items-center gap-2">
          <p>
            © {new Date().getFullYear()} Kuray Karaaslan. {t('shared.footer.all_rights_reserved')}
          </p>
          <SystemStatusButton />
        </div>
        <div className="col-span-1 flex flex-row flex-wrap justify-start"></div>
        <nav aria-label="Social links" className="col-span-1 flex flex-row flex-wrap justify-end gap-1">
          <Link href="https://twitter.com/kuraykaraaslan" target="_blank" rel="noopener noreferrer" aria-label="Twitter profile (opens in new tab)">
            <FontAwesomeIcon icon={faXTwitter} style={{ width: '24px', height: '24px' }} aria-hidden="true" />
          </Link>
          <Link href="https://github.com/kuraykaraaslan" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile (opens in new tab)">
            <FontAwesomeIcon icon={faGithub} style={{ width: '24px', height: '24px' }} aria-hidden="true" />
          </Link>
          <Link
            href="https://www.linkedin.com/in/kuraykaraaslan/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile (opens in new tab)"
          >
            <FontAwesomeIcon icon={faLinkedin} style={{ width: '24px', height: '24px' }} aria-hidden="true" />
          </Link>
        </nav>
      </footer>
    </>
  )
}

export default Footer
