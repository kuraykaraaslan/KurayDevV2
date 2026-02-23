import { SafeUser } from '@/types/user/UserTypes'
import UserProfileBanner from './partials/UserProfileBanner'
import UserProfileInfo from './partials/UserProfileInfo'
import UserProfileSocialLinks from './partials/UserProfileSocialLinks'

interface UserProfileProps {
  user: SafeUser
}

export default function UserProfile({ user }: UserProfileProps) {
  const displayName = user.userProfile?.name || user.name || 'Author'
  const username = user.userProfile?.username
  const profilePicture = user.userProfile?.profilePicture
  const headerImage = user.userProfile?.headerImage
  const bio = user.userProfile?.biography
  const socialLinks = user.userProfile?.socialLinks ?? []

  return (
    <>
      <UserProfileBanner headerImage={headerImage} />

      <div className="max-w-4xl mx-auto px-6">
        <UserProfileInfo
          displayName={displayName}
          username={username}
          bio={bio}
          profilePicture={profilePicture}
          createdAt={user.createdAt}
        />
        <UserProfileSocialLinks socialLinks={socialLinks} />
      </div>
    </>
  )
}
