import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SocialLinkItem } from '@/types/user/UserProfileTypes'
import { SocialLinkIconMap } from '@/types/ui/SocialLinkIconMap'

interface UserProfileSocialLinksProps {
  socialLinks: SocialLinkItem[]
}

export default function UserProfileSocialLinks({ socialLinks }: UserProfileSocialLinksProps) {
  const sorted = [...socialLinks]
    .sort((a, b) => a.order - b.order)
    .filter((link) => !!link.url)

  if (sorted.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {sorted.map((link) => {
        const mapping = SocialLinkIconMap[link.platform]
        if (!mapping) return null
        return (
          <a
            key={link.id}
            href={link.url!}
            target="_blank"
            rel="noopener noreferrer"
            title={mapping.label}
            className={`btn btn-sm btn-ghost gap-2 text-base-content/60 border border-base-300 transition-all hover:border-primary/30 hover:shadow-md ${mapping.color}`}
          >
            <FontAwesomeIcon icon={mapping.icon} className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{mapping.label}</span>
          </a>
        )
      })}
    </div>
  )
}
