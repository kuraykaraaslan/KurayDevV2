'use client'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCode } from '@fortawesome/free-solid-svg-icons'
import Link from '@/libs/i18n/Link'
interface LogoProps {
  className?: string
  iconClassName?: string
  textClassName?: string
  href?: string
}

const Logo = ({
  href = '/',
  className = 'btn btn-ghost md:rounded-full hover:bg-transparent active:bg-transparent focus:bg-transparent',
  iconClassName = 'text-2xl w-6',
  textClassName = 'text-lg font-bold',
}: LogoProps) => {
  const { t } = useTranslation()
  return (
    <Link className={className + ' !flex-row'} href={href} onClick={() => window.scrollTo(0, 0)} aria-label={t('common.go_to_homepage')} dir="ltr">
      <FontAwesomeIcon icon={faCode} className={iconClassName} />
      <span className={textClassName + ' ml-1 select-none'}>kuray.dev</span>
    </Link>
  )
}

export default Logo
