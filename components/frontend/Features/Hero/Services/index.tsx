'use client'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { faApple, faAndroid, faReact, faPhp, faJava } from '@fortawesome/free-brands-svg-icons'
import { faDesktop, faGlobe, faWind } from '@fortawesome/free-solid-svg-icons'

import SingleService from './Partials/SingleService'
import { Service } from '@/types/content/ProjectTypes'

const Services = () => {
  const { t } = useTranslation()
  const container = useRef(null)
  const projects: Service[] = [
    {
      id: '1',
      image: '/assets/img/services/phone.jpg',
      title: t('pages.hero.services.mobile_title'),
      description: t('pages.hero.services.mobile_description'),
      urls: [],
      tags: [
        { name: 'Android', color: 'bg-green-200', icon: faAndroid },
        { name: 'Apple', color: 'bg-blue-200', icon: faApple },
        { name: 'React Native', color: 'bg-blue-200', icon: faReact },
      ],
    },
    {
      id: '2',
      image: '/assets/img/services/web.jpg',
      title: t('pages.hero.services.web_title'),
      description: t('pages.hero.services.web_description'),
      urls: [],
      tags: [
        { name: 'React', color: 'bg-blue-200', icon: faReact },
        { name: 'Web', color: 'bg-yellow-200', icon: faGlobe },
        { name: 'Desktop', color: 'bg-yellow-200', icon: faDesktop },
      ],
    },
    {
      id: '3',
      image: '/assets/img/services/admin.jpg',
      title: t('pages.hero.services.backend_title'),
      description: t('pages.hero.services.backend_description'),
      urls: [],
      tags: [
        { name: 'Node.js', color: 'bg-green-200', icon: faWind },
        { name: 'PHP', color: 'bg-purple-200', icon: faPhp },
        { name: 'Java', color: 'bg-red-200', icon: faJava },
      ],
    },
    {
      id: '4',
      image: '/assets/img/services/other2.jpg',
      title: t('pages.hero.services.other_title'),
      bgColor: 'bg-base-200',
      description: t('pages.hero.services.other_description'),
      urls: [],
      tags: [],
    },
  ]

  return (
    <>
      <section className="bg-base-100 pt-16" id="projects">
        <div
          className="px-4 mx-auto max-w-screen-xl lg:pb-16 lg:px-6 duration-1000"
          ref={container}
        >
          <div className="mx-auto max-w-screen-sm text-center lg:mb-16 mb-8 -mt-8 lg-mt-0">
            <h2 className="mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold">{t('pages.hero.services.title')}</h2>
            <p className="font-light sm:text-xl">
              {t('pages.hero.services.description')}
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {projects.map((service: Service) => (
              <SingleService key={service.id} service={service} />
            ))}
          </div>
        </div>

        <div
          className="flex carousel-indicators gap-2 bg-transparent select-none"
          style={{
            zIndex: 50,
            position: 'relative',
            left: '0',
            right: '0',
            margin: 'auto',
            height: '0px',
            width: '100%',
            bottom: '20',
            display: 'flex',
            justifyContent: 'center',
          }}
        ></div>
      </section>
    </>
  )
}

export default Services
