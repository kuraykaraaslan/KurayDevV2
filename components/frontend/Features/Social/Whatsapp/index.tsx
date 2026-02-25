'use client'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { useTranslation } from 'react-i18next'

const Whatsapp = () => {
  const { t } = useTranslation()

  const [count, setCount] = useState(0)
  const [sayac, setSayac] = useState<NodeJS.Timeout | null>(null)

  const [resetted, setResetted] = useState(false)

  useEffect(() => {
    const scrollToTopBtn = document.getElementById('whatsapp') as HTMLElement
    //make the button appear slowly  when the user scrolls down 20px from the top to 500ms

    window?.addEventListener('scroll', () => {
      let aligned = window?.scrollY * 0.1 - 80
      if (aligned > 20) {
        aligned = 20
      }
      scrollToTopBtn.style.right = aligned + 'px'
      if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        scrollToTopBtn.style.display = 'flex'
      } else {
        scrollToTopBtn.style.display = 'none'
      }

      //if it is end of the page, for footer raise it up to 100px
      if (window?.innerHeight + window?.scrollY >= document.body.offsetHeight - 50) {
        const diff = window?.innerHeight + window?.scrollY - document.body.offsetHeight + 50
        scrollToTopBtn.style.bottom = diff + 100 + 'px'
      } else {
        scrollToTopBtn.style.bottom = '100px'
      }
    })
  })

  useEffect(() => {
    if (sayac) {
      return
    }

    if (resetted) {
      setSayac(null)
      return
    }

    // create a Timeout
    setSayac(
      setTimeout(
        () => {
          // 10 to 100 seconds
          setCount((prev) => prev + 1)
          //new Audio("/assets/wav/beep-07a.wav").play();

          //Clear the Timeout
          setSayac(null)
        },
        Math.floor(Math.random() * 10000) + 10000
      )
    )
  }, [])

  return (
    <div
      className="fixed transition duration-1000 ease-in-out bg-[#25D366] text-white cursor-pointer shadow-lg rounded-full"
      style={{ zIndex: 103, right: '-80px', bottom: '100px' }}
      id="whatsapp"
      role="button"
      tabIndex={0}
      aria-label="Chat on WhatsApp"
      onClick={() => window?.open('https://wa.me/905459223554')}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') window?.open('https://wa.me/905459223554') }}
    >
      <div className="relative transition duration-1000 ease-in-out bg-[#25D366] cursor-pointer p-4 rounded-full group">
        <FontAwesomeIcon icon={faWhatsapp} className="text-l text-white w-8 h-8 md:w-6 md:h-6" aria-hidden="true" />
        {count > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-1 text-sm">
            {count}
          </span>
        )}

        {count > 0 && (
          <div
            className="absolute bg-white text-black rounded-lg p-2 bottom-0 w-48 right-0 transform -translate-y-1/2 -translate-x-1/3 shadow-lg hidden group-hover:block transition duration-1000 ease-in-out"
            onMouseEnter={() => setResetted(true)}
            onClick={() => setResetted(true)}
          >
            <p>{t('shared.whatsapp.message')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Whatsapp
