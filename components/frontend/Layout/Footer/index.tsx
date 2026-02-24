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
        <div className="col-span-1 flex flex-row flex-wrap justify-end">
          <Link href="https://twitter.com/kuraykaraaslan" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faXTwitter} style={{ width: '24px', height: '24px' }} />
          </Link>
          <Link href="https://github.com/kuraykaraaslan" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faGithub} style={{ width: '24px', height: '24px' }} />
          </Link>
          <Link
            href="https://www.linkedin.com/in/kuraykaraaslan/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faLinkedin} style={{ width: '24px', height: '24px' }} />
          </Link>
        </div>
      </footer>
    </>
  )
}

export default Footer
