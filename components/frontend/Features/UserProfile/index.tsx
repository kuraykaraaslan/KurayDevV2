import { SafeUser } from '@/types/user/UserTypes'
import UserProfileBanner from './partials/UserProfileBanner'
import UserProfileSocialLinks from './partials/UserProfileSocialLinks'

interface UserProfileProps {
  user: SafeUser
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <>
      <UserProfileBanner user={user} />

      <div className="max-w-4xl mx-auto px-6">
        <UserProfileSocialLinks user={user} />
      </div>
    </>
  )
}
