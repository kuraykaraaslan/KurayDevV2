import { useTranslation } from 'react-i18next'
import Link from '@/libs/i18n/Link'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import HeatMap from './Partial/HeatMap'

const GitContributions = () => {
  const { t } = useTranslation()
  return (
    <>
      <div className="hero min-h-screen bg-base-100 hidden lg:flex items-center justify-center">
        <div className="hero-content text-center">
          <div className="">
            <h2 className="text-5xl font-bold">{t('pages.hero.git_contributions.title')}</h2>
            <p className="py-6">
              {t('pages.hero.git_contributions.description')}
            </p>
            <HeatMap />
            <div className="flex justify-center py-6">
              <Link
                href="https://github.com/kuraykaraaslan"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('pages.hero.git_contributions.aria_label')}
                className="btn btn-primary"
              >
                <FontAwesomeIcon
                  icon={faGithub}
                  className="me-2 text-xl"
                  height="20"
                  width="20"
                  aria-hidden="true"
                />
                {t('pages.hero.git_contributions.view_github')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default GitContributions
