'use client'
import { useTranslation } from 'react-i18next'
import SinglePlatform from './Partials/SinglePlatform'

const Platforms = () => {
  const { t } = useTranslation()
  const platforms = [
    {
      name: 'Upwork',
      icon: '/assets/svg/upwork.svg',
      url: 'https://www.upwork.com/freelancers/~01694c65c4ad50b809',
      bgColor: 'bg-white',
    },
    {
      name: 'Freelancer',
      icon: '/assets/svg/freelancer.svg',
      url: 'https://www.freelancer.com',
      bgColor: 'bg-white',
    },
    {
      name: 'Fiverr',
      icon: '/assets/svg/fiverr.svg',
      url: 'https://www.fiverr.com/kuraykaraaslan',
      bgColor: 'bg-white',
    },
  ]

  return (
    <section className="py-12 bg-base-200 ">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-20 text-center">
          <span className="text-center font-medium mb-4 block">{t('pages.hero.platforms.subtitle')}</span>
          <h2 className="text-4xl text-center font-bold">
            {t('pages.hero.platforms.title')}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 mx-auto max-w-3xl">
          {platforms.map((platform) => (
            <SinglePlatform key={platform.name} {...platform} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Platforms
