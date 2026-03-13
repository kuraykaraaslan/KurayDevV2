import Image from 'next/image'
import { createHash } from 'crypto'
import type { SafeUser } from '@/types/user/UserTypes'

interface UserProfileProps {
  user: SafeUser
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function UserProfile({ user }: UserProfileProps) {
  const username = user.userProfile?.username
  const rawName = user.userProfile?.name || user.name
  const safeName = rawName && !looksLikeEmail(rawName) ? rawName : null
  const emailLocalPart = user.email.split('@')[0]
  const displayName = safeName || username || emailLocalPart || user.userId
  const biography = user.userProfile?.biography

  const identiconSeed = username || user.userId
  const identiconHash = createHash('md5').update(identiconSeed).digest('hex')
  const identiconUrl = `https://www.gravatar.com/avatar/${identiconHash}?d=identicon`

  const avatarSrc = user.userProfile?.profilePicture || identiconUrl
  const headerSrc = user.userProfile?.headerImage

  return (
    <section className="w-full bg-base-200">
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <div className="overflow-hidden">
          {headerSrc ? (
            <div className="relative w-full h-44 md:h-56">
              <Image
                src={headerSrc}
                alt=""
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </div>
          ) : (
            <div className="h-20 md:h-24 bg-base-200" />
          )}

          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-10">
              <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden ring ring-primary ring-offset-base-100 ring-offset-2 bg-base-100">
                <Image
                  src={avatarSrc}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="112px"
                  priority
                />
              </div>

              <div className="pb-2 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold leading-tight break-words">{displayName}</h1>
                {username ? (
                  <p className="text-sm text-base-content/60 break-words">@{username}</p>
                ) : null}
              </div>
            </div>

            {biography ? (
              <p className="mt-4 text-base-content/80 whitespace-pre-wrap">{biography}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
