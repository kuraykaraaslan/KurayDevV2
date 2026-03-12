'use client'

import { useTranslation } from 'react-i18next'

interface UserProfileInfoProps {
  displayName: string
  username?: string | null
  bio?: string | null
  profilePicture?: string | null
  createdAt?: Date
}

export default function UserProfileInfo({
  displayName,
  username,
  bio,
  profilePicture,
  createdAt,
}: UserProfileInfoProps) {
  const { t } = useTranslation()
  return (
    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-full flex justify-center">
      <div className="relative bg-base-100/90 rounded-2xl shadow-2xl px-8 py-8 flex flex-col items-center max-w-2xl w-full border border-base-200 backdrop-blur-md">
        {/* Avatar - üstte, hafif yukarı taşmış */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2">
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-full ring-4 ring-primary bg-base-300 overflow-hidden shadow-xl drop-shadow-lg border-4 border-base-100">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-base-300">
                <span className="text-5xl font-extrabold text-primary select-none">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* İçerik */}
        <div className="mt-20 flex flex-col items-center w-full">
          {/* İsim ve rozet */}
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-base-content">{displayName}</h1>
            <span className="badge badge-primary text-base">{t('frontend.user_profile.author')}</span>
          </div>

          {/* Username handle */}
          {username && (
            <p className="text-sm text-base-content/50 font-mono mb-2">@{username}</p>
          )}

          {/* Member since */}
          {createdAt && (
            <p className="text-xs text-base-content/40 mb-2 font-mono">
              {t('frontend.user_profile.member_since')} {new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </p>
          )}

          {/* Bio */}
          {bio && (
            <p className="text-base-content/70 leading-relaxed text-base border-l-4 border-primary/40 pl-4 mt-2 max-w-xl">
              {bio}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
