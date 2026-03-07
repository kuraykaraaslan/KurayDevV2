'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNodes } from '@fortawesome/free-solid-svg-icons'
import Link from '@/libs/i18n/Link'
import WorldMap from 'react-svg-worldmap'

const HireMeVideo = dynamic(() => import('./Partials/HireMeVideo'), { ssr: false })

const HireMe = () => {
  const { t } = useTranslation()
  const [_dotColor, setDotColor] = useState('#ffffff')

  useEffect(() => {
    const html_theme = document.documentElement.getAttribute('data-theme')

    if (html_theme === 'dark') {
      setDotColor('#ffffff')
    } else if (html_theme === 'light') {
      setDotColor('#000000')
    } else {
      setDotColor('#ffffff')
    }
  }, [])

  const mapProps = {
    data: [],
    size: 300,
    backgroundColor: 'transparent',
    strokeColor: '#fff',
    color: 'white',
    styleFunction: (context: any) => {
      return {
        fill: 'bg-primary',
        stroke: context.color,
        strokeWidth: 0.5,
      }
    },
    tooltipTextFunction: (context: any) => {
      return `${context.countryName}: XXX ${context.countryValue}`
    },
  }

  return (
    <>
      <div className="relative bg-base-200 min-h-screen">
        <video
          muted
          loop
          autoPlay
          className="absolute inset-0 z-0 object-cover w-full h-screen opacity-25"
        >
          <source src="/assets/videos/freelance-welcome.mp4" type="video/mp4" />
        </video>
        <div
          className="hero min-h-screen select-none"
          id="#home"
          style={{
            zIndex: 8,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <div className="hero-content">
            <div className="flex-1 max-w-2xl">
              <div className="max-w-lg me-4">
                <h2 className="text-5xl font-bold">{t('pages.hero.hire_me.heading')}</h2>
                <p className="py-6">
                  {t('pages.hero.hire_me.description')}
                </p>
                <HireMeVideo />
                <Link className="btn btn-primary" href="/freelance#services">
                  <FontAwesomeIcon icon={faCircleNodes} className="me-2 text-xl w-6 h-6" />
                  {t('pages.hero.hire_me.cta')}
                </Link>
              </div>
            </div>
            <div className="hidden lg:block max-w-md p-10 bg-primary">
              <WorldMap {...mapProps} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default HireMe
