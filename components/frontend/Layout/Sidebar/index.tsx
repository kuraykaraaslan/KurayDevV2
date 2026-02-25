'use client'
import { useEffect, useRef, useState } from 'react'
import Menu from '../Menu'
import { MenuItem } from '@/types/ui/UITypes'

const closeSidebar = () => {
  const drawerCheckbox = document.getElementById('my-drawer') as HTMLInputElement
  if (drawerCheckbox) drawerCheckbox.checked = false
}

const Sidebar = ({ menuItems }: { menuItems: MenuItem[] }) => {
  const menuRef = useRef<HTMLUListElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const checkbox = document.getElementById('my-drawer') as HTMLInputElement
    if (!checkbox) return

    const onDrawerChange = () => {
      const open = checkbox.checked
      setIsOpen(open)

      const mainContent = document.querySelector<HTMLElement>('.drawer-content')

      if (open) {
        // Ana içeriği etkisizleştir: Tab, tıklama, ekran okuyucu erişimini engeller
        mainContent?.setAttribute('inert', '')
        requestAnimationFrame(() => {
          const firstItem = menuRef.current?.querySelector<HTMLElement>('button, a')
          firstItem?.focus()
        })
      } else {
        mainContent?.removeAttribute('inert')
        const hamburger = document.querySelector<HTMLElement>('label[for="my-drawer"]')
        hamburger?.focus()
      }
    }

    checkbox.addEventListener('change', onDrawerChange)
    return () => checkbox.removeEventListener('change', onDrawerChange)
  }, [])

  // Escape ile kapat
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const checkbox = document.getElementById('my-drawer') as HTMLInputElement
        if (checkbox?.checked) closeSidebar()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Sidebar içinde Tab döngüsü
  const handleSidebarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !menuRef.current) return

    const aside = e.currentTarget as HTMLElement
    const focusables = Array.from(
      aside.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('inert'))

    if (!focusables.length) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <div
      className="drawer-side"
      style={{ zIndex: 70 }}
      aria-hidden={!isOpen}
    >
      <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay backdrop-blur-sm" />

      <aside
        role="dialog"
        aria-modal={isOpen}
        aria-label="Navigation menu"
        onKeyDown={handleSidebarKeyDown}
        className="flex flex-col w-72 h-full bg-base-100 border-r border-base-200 shadow-2xl"
      >
        {/* Close button */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-base-200">
          <span className="text-base font-semibold text-base-content opacity-70 tracking-wide uppercase text-xs select-none">
            Menu
          </span>
          <button
            onClick={closeSidebar}
            className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content hover:bg-base-200"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu items */}
        <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto py-4 px-3">
          <ul ref={menuRef} className="menu menu-md gap-1 w-full p-0">
            <Menu isSidebar={true} menuItems={menuItems} onItemClick={closeSidebar} />
          </ul>
        </nav>
      </aside>
    </div>
  )
}

export default Sidebar
