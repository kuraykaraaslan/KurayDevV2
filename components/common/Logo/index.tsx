import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCode } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
interface LogoProps {
  className?: string
  iconClassName?: string
  textClassName?: string
  href?: string
}

const Logo = ({
  href = "/",
  className = "btn btn-ghost md:rounded-full hover:bg-transparent active:bg-transparent focus:bg-transparent focus:outline-none focus:ring-0 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:focus:bg-transparent disabled:active:bg-transparent disabled:focus:ring-0 disabled:focus:outline-none"
, iconClassName = "text-2xl w-6", textClassName = "text-lg font-bold" }: LogoProps) => (
  <Link className={className} href={href} onClick={() => window.scrollTo(0, 0)}>
    <FontAwesomeIcon icon={faCode} className={iconClassName} />
    <span className={textClassName + ' ml-1'}>kuray.dev</span>
  </Link>
)

export default Logo
