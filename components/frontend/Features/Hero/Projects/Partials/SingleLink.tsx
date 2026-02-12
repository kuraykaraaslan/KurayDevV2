import Link from 'next/link'
import {
  faReact,
  faHtml5,
  faPython,
  faPhp,
  faJava,
  faJs,
  faGithub,
  faGitlab,
  faYoutube,
  faLinkedin,
  faTwitter,
  faInstagram,
  faFacebook,
  faDiscord,
} from '@fortawesome/free-brands-svg-icons'
import { faGlobe, faFile, faCloud, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// Map URLs to icons and titles
const iconAndTitleMap: { pattern: RegExp; icon: IconDefinition; title: string }[] = [
  { pattern: /github\.com/, icon: faGithub, title: 'GitHub' },
  { pattern: /gitlab\.com/, icon: faGitlab, title: 'GitLab' },
  { pattern: /youtube\.com/, icon: faYoutube, title: 'YouTube' },
  { pattern: /linkedin\.com/, icon: faLinkedin, title: 'LinkedIn' },
  { pattern: /twitter\.com/, icon: faTwitter, title: 'Twitter' },
  { pattern: /instagram\.com/, icon: faInstagram, title: 'Instagram' },
  { pattern: /facebook\.com/, icon: faFacebook, title: 'Facebook' },
  { pattern: /discord\.com/, icon: faDiscord, title: 'Discord' },
  { pattern: /react/, icon: faReact, title: 'React' },
  { pattern: /html/, icon: faHtml5, title: 'HTML5' },
  { pattern: /python/, icon: faPython, title: 'Python' },
  { pattern: /php/, icon: faPhp, title: 'PHP' },
  { pattern: /java/, icon: faJava, title: 'Java' },
  { pattern: /javascript|js/, icon: faJs, title: 'JavaScript' },
  { pattern: /cloud/, icon: faCloud, title: 'Cloud Service' },
  { pattern: /file/, icon: faFile, title: 'File Resource' },
  { pattern: /.*\..*/, icon: faGlobe, title: 'Website' }, // Default for general websites
]

const SingleLink = ({ url }: { url: string }) => {
  // Find a matching icon and title based on the URL
  const match = iconAndTitleMap.find((entry) => entry.pattern.test(url))

  const icon = match?.icon || faGlobe // Default icon
  const title = match?.title || 'Link' // Default title

  return (
    <Link href={url} className="inline-flex items-center font-medium hover:underline">
      <FontAwesomeIcon
        icon={icon}
        style={{
          width: '1rem',
          height: '1rem',
          marginRight: '0.25rem',
          paddingTop: '0.25rem',
        }}
      />
      {title}
    </Link>
  )
}

export default SingleLink
