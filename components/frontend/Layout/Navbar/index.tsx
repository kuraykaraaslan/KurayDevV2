
'use client'
import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import Menu from '../Menu'
import dynamic from 'next/dynamic'
import Logo from '@/components/common/Layout/Logo'
import ReadingProgressBar from '@/components/frontend/UI/Progress/ReadingProgressBar'
import SearchButton from './Partials/SearchButton'
import { MenuItem } from '@/types/ui/UITypes'

const NavbarAuthButton = dynamic(
  () => import('@/components/common/UI/Navigation/NavbarAuthButton/index'),
  { ssr: false }
)

const LangButton = dynamic(() => import('./Partials/LangButton'), { ssr: false })


const ThemeButton = dynamic(() => import('./Partials/ThemeButton'), { ssr: false })

const Navbar = ({ menuItems }: { menuItems: MenuItem[] }) => {
  const { t } = useTranslation()
  const [isTopReached, setIsTopReached] = useState(true)
  const drawerRef = useRef<HTMLInputElement | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const checkbox = document.getElementById('my-drawer') as HTMLInputElement
    drawerRef.current = checkbox
    if (!checkbox) return
    const onChange = () => setDrawerOpen(checkbox.checked)
    checkbox.addEventListener('change', onChange)
    return () => checkbox.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (window?.scrollY > 40) {
        setIsTopReached(false)
      } else {
        setIsTopReached(true)
      }
    }

    window?.addEventListener('scroll', handleScroll)

    return () => {
      window?.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollTo100IfNot = () => {
    if (window?.scrollY < 60) {
      window?.scrollTo(0, 60)
    }
  }

  return (
    <nav
      aria-label={t('navbar.main_navigation')}
      className={
        'fixed top-0 z-50 w-full transition-all duration-300 ease-in-out ' +
        (isTopReached ? ' pl-2  sm:px-6 lg:px-8 pt-3 pb-6' : ' px-0 pt-0 pb-6')
      }
      style={{ zIndex: 60, width: '100%' }}
    >
      <div
        className={
          'navbar self-center	' +
          (isTopReached
            ? ' bg-transparent'
            : ' shadow-lg border border-base-200 rounded-none from-base-100 to-base-300 bg-gradient-to-b')
        }
      >
        <div className="flex-none xl:hidden">
          <label
            htmlFor="my-drawer"
            aria-label={drawerOpen ? t('navbar.close_sidebar_menu') : t('navbar.open_sidebar_menu')}
            aria-expanded={drawerOpen}
            role="button"
            className="btn btn-circle btn-ghost"
            onClick={scrollTo100IfNot}
          >
            <FontAwesomeIcon icon={faBars} style={{ width: '24px', height: '24px' }} aria-hidden="true" />
          </label>
        </div>
        <div className="md:mx-2 flex-1 md:px-2 text-lg font-semibold">
          <div className="flex items-center gap-2  justify-between lg:justify-start">
            <Logo />
            <div className="flex lg:gap-2">
              <ThemeButton />
              <LangButton />
              <SearchButton />
            </div>
          </div>
        </div>
        <div className="hidden flex-none xl:block">
          <ul className="menu menu-horizontal gap-1 hidden lg:flex">
            {/* Navbar menu content here */}
            <Menu menuItems={menuItems} />
          </ul>
        </div>
        <div className="">
          <ul className="menu menu-horizontal gap-1 hidden lg:flex">
            <NavbarAuthButton />
          </ul>
        </div>
      </div>
      <ReadingProgressBar />
    </nav>
  )
}

export default Navbar
