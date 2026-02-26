'use client'

import Link from '@/libs/i18n/Link'
import useGlobalStore from '@/libs/zustand'
import Image from 'next/image'
import { createHash } from 'crypto'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const NavbarAuthButton = () => {
  const { t } = useTranslation()
  const { user } = useGlobalStore()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const openDirectionRef = useRef<'first' | 'last'>('first')

  const hash = createHash('sha256').digest('hex')
  const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon`

  // -------------------------
  // Close dropdown on click outside
  // -------------------------
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // -------------------------
  // Focus first/last menu item when dropdown opens
  // -------------------------
  useEffect(() => {
    if (open && menuRef.current) {
      const items = Array.from(menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]'))
      if (openDirectionRef.current === 'last') {
        items[items.length - 1]?.focus()
      } else {
        items[0]?.focus()
      }
    }
  }, [open])

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      openDirectionRef.current = 'first'
      setOpen(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      openDirectionRef.current = 'last'
      setOpen(true)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    const items = menuRef.current
      ? Array.from(menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]'))
      : []
    const activeIndex = items.indexOf(document.activeElement as HTMLElement)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = activeIndex < items.length - 1 ? activeIndex + 1 : 0
      items[next]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = activeIndex > 0 ? activeIndex - 1 : items.length - 1
      items[prev]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      items[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      items[items.length - 1]?.focus()
    } else if (e.key === 'Escape') {
      setOpen(false)
      buttonRef.current?.focus()
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget as Node)) {
      setOpen(false)
    }
  }

  // -------------------------
  // LOGGED OUT → minimal icon
  // -------------------------
  if (!user) {
    return (
      <Link
        href="/auth/login"
        ignoreLang
        className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center ring-1 ring-primary ring-2 transition"
        aria-label={t('common.navbar.login')}
      >
        <FontAwesomeIcon icon={faUser} className="text-xs" aria-hidden="true" />
      </Link>
    )
  }

  return (
    <div className="relative" ref={dropdownRef} onBlur={handleBlur}>
      {/* Avatar Button */}
      <button
        ref={buttonRef}
        onClick={() => { openDirectionRef.current = 'first'; setOpen(!open) }}
        onKeyDown={handleButtonKeyDown}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('common.navbar.user_menu')}
        className="flex items-center justify-center rounded-full border border-base-300 w-9 h-9 overflow-hidden ring-1 ring-primary transition"
      >
        <Image
          width={32}
          height={32}
          src={user.userProfile.profilePicture || gravatarUrl}
          alt=""
          aria-hidden="true"
          className="w-8 h-8 rounded-full"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 mt-2 w-40 bg-base-100 shadow-lg rounded-lg border border-base-300 z-50 p-2 flex flex-col gap-1"
        >
          {(user.userRole === 'ADMIN' || user.userRole === 'AUTHOR') && (
            <Link
              href="/admin"
              ignoreLang
              role="menuitem"
              className="px-3 py-2 rounded-md hover:bg-base-200 text-sm"
              onClick={() => setOpen(false)}
            >
              {t('common.navbar.admin_dashboard')}
            </Link>
          )}
          <Link
            href="/settings"
            ignoreLang
            role="menuitem"
            className="px-3 py-2 rounded-md hover:bg-base-200 text-sm border-b border-base-300"
            onClick={() => setOpen(false)}
          >
            {t('common.navbar.user_settings')}
          </Link>

          <Link
            href="/auth/logout"
            ignoreLang
            role="menuitem"
            className="px-3 py-2 rounded-md hover:bg-base-200 text-sm text-red-500"
            onClick={() => setOpen(false)}
          >
            {t('common.navbar.logout')}
          </Link>
        </div>
      )}
    </div>
  )
}

export default NavbarAuthButton
