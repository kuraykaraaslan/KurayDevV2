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
  // LOGGED OUT → minimal icon
  // -------------------------
  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center ring-1 ring-primary ring-2 transition"
      >
        <FontAwesomeIcon icon={faUser} className="text-xs" />
      </Link>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center rounded-full border border-base-300 w-9 h-9 overflow-hidden ring-1 ring-primary transition"
      >
        <Image
          width={32}
          height={32}
          src={user.userProfile.profilePicture || gravatarUrl}
          alt="User"
          className="w-8 h-8 rounded-full"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-base-100 shadow-lg rounded-lg border border-base-300 z-50 p-2 flex flex-col gap-1">
          {(user.userRole === 'ADMIN' || user.userRole === 'AUTHOR') && (
            <Link
              href="/admin"
              className="px-3 py-2 rounded-md hover:bg-base-200 text-sm"
              onClick={() => setOpen(false)}
            >
              {t('common.navbar_auth.admin_dashboard')}
            </Link>
          )}
          <Link
            href="/settings"
            className="px-3 py-2 rounded-md hover:bg-base-200 text-sm border-b border-base-300"
            onClick={() => setOpen(false)}
          >
            {t('common.navbar_auth.user_settings')}
          </Link>

          <Link
            href="/auth/logout"
            className="px-3 py-2 rounded-md hover:bg-base-200 text-sm text-red-500"
            onClick={() => setOpen(false)}
          >
            {t('common.navbar_auth.logout')}
          </Link>
        </div>
      )}
    </div>
  )
}

export default NavbarAuthButton
