'use client'
import {
  faBars,
  faChevronDown,
  faXmark,
  faHouse,
  faNewspaper,
  faEnvelope,
  faCalendarDays,
  faUsers,
  faGear,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeButton from './Partials/ThemeButton'
import NotificationBell from './Partials/NotificationBell'
import Logo from '@/components/common/Layout/Logo'
import dynamic from 'next/dynamic'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { useTranslation } from 'react-i18next'

const NavbarAuthButton = dynamic(
  () => import('@/components/common/UI/Navigation/NavbarAuthButton'),
  { ssr: false }
)

type NavItem = { name: string; href: string }
type NavGroup = { label: string; icon: IconDefinition; items: NavItem[] }

// ─── Desktop Dropdown ────────────────────────────────────────────────────────

const DesktopDropdown = ({ group }: { group: NavGroup }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const isGroupActive = group.items.some((item) => pathname === item.href)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-base-200 ${
          isGroupActive ? 'text-primary' : 'text-base-content/80'
        }`}
      >
        <FontAwesomeIcon icon={group.icon} className="w-3.5 h-3.5" />
        <span>{group.label}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 min-w-[160px] rounded-xl shadow-lg border border-base-300 bg-base-100 py-1 z-50">
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center px-4 py-2 text-sm transition-colors hover:bg-base-200 ${
                pathname === item.href ? 'text-primary font-semibold' : 'text-base-content/80'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Mobile Accordion Group ──────────────────────────────────────────────────

const MobileAccordion = ({
  group,
  onNavigate,
}: {
  group: NavGroup
  onNavigate: () => void
}) => {
  const pathname = usePathname()
  const isGroupActive = group.items.some((item) => pathname === item.href)
  const [open, setOpen] = useState(isGroupActive)

  return (
    <div className="border-b border-base-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-base-200 ${
          isGroupActive ? 'text-primary' : 'text-base-content'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <FontAwesomeIcon icon={group.icon} className="w-4 h-4" />
          <span>{group.label}</span>
        </div>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {group.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center pl-11 pr-4 py-2.5 text-sm transition-colors hover:bg-base-200 border-l-2 ml-4 ${
              pathname === item.href
                ? 'text-primary font-semibold border-primary'
                : 'text-base-content/70 border-transparent'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Main Navbar ─────────────────────────────────────────────────────────────

const Navbar = () => {
  const { t } = useTranslation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev)

  const navGroups: NavGroup[] = [
    {
      label: t('admin.navbar.group_dashboard'),
      icon: faHouse,
      items: [
        { name: t('admin.navbar.item_overview'), href: '/admin' },
        { name: t('admin.navbar.item_analytics'), href: '/admin/analytics' },
      ],
    },
    {
      label: t('admin.navbar.group_content'),
      icon: faNewspaper,
      items: [
        { name: t('admin.navbar.item_projects'), href: '/admin/projects' },
        { name: t('admin.navbar.item_categories'), href: '/admin/categories' },
        { name: t('admin.navbar.item_posts'), href: '/admin/posts' },
        { name: t('admin.navbar.item_comments'), href: '/admin/comments' },
        { name: t('admin.navbar.item_testimonials'), href: '/admin/testimonials' },
        { name: t('admin.navbar.item_media'), href: '/admin/media' },
      ],
    },
    {
      label: t('admin.navbar.group_communication'),
      icon: faEnvelope,
      items: [
        { name: t('admin.navbar.item_contacts'), href: '/admin/contacts' },
        { name: t('admin.navbar.item_subscriptions'), href: '/admin/subscriptions' },
        { name: t('admin.navbar.item_campaigns'), href: '/admin/campaigns' },
        { name: t('admin.navbar.item_chatbot'), href: '/admin/chatbot' },
      ],
    },
    {
      label: t('admin.navbar.group_scheduling'),
      icon: faCalendarDays,
      items: [
        { name: t('admin.navbar.item_appointments'), href: '/admin/appointments' },
        { name: t('admin.navbar.item_slots'), href: '/admin/slots' },
      ],
    },
    {
      label: t('admin.navbar.group_users'),
      icon: faUsers,
      items: [{ name: t('admin.navbar.item_users'), href: '/admin/users' }],
    },
    {
      label: t('admin.navbar.group_system'),
      icon: faGear,
      items: [
        { name: t('admin.navbar.item_settings'), href: '/admin/settings' },
        { name: t('admin.navbar.item_short_links'), href: '/admin/short-links' },
      ],
    },
  ]

  // Close on route change
  const pathname = usePathname()
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <>
      <nav
        className="relative mx-auto h-16 flex items-center justify-between lg:px-8 from-base-100 to-base-300 bg-gradient-to-b shadow-lg text-primary"
        aria-label="Admin navigation"
      >
        {/* Logo */}
        <div className="py-4 pl-4 lg:pl-0 flex items-center gap-2">
          <Logo href="/admin" />
          <ThemeButton />
        </div>

        {/* Mobile hamburger */}
        <div className="flex lg:hidden items-center gap-2 mr-2">
          <NotificationBell />
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 hover:bg-base-200 transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Open main menu"
            aria-expanded={isMobileMenuOpen}
          >
            <FontAwesomeIcon icon={faBars} className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop grouped menu */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-center gap-0.5">
          {navGroups.map((group) => (
            <DesktopDropdown key={group.label} group={group} />
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden lg:flex lg:justify-end items-center gap-2">
          <NotificationBell />
          <NavbarAuthButton />
        </div>
      </nav>

      {/* Mobile sidebar overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-base-content/30"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />

        {/* Sidebar panel */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-72 bg-base-100 flex flex-col shadow-xl transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-base-200 shrink-0">
            <Logo href="/admin" />
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md hover:bg-base-200 transition-colors"
              aria-label="Close menu"
            >
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
            </button>
          </div>

          {/* Accordion groups */}
          <div className="flex-1 overflow-y-auto py-2">
            {navGroups.map((group) => (
              <MobileAccordion
                key={group.label}
                group={group}
                onNavigate={toggleMobileMenu}
              />
            ))}
          </div>

          {/* Mobile auth */}
          <div className="px-4 py-4 border-t border-base-200 shrink-0">
            <NavbarAuthButton />
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar
