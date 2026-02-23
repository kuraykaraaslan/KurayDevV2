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
  return (
    <div className="relative -mt-20 mb-8">
      {/* Avatar */}
      <div className="mb-4">
        <div className="w-32 h-32 md:w-36 md:h-36 rounded-full ring-4 ring-base-100 bg-base-300 overflow-hidden shadow-xl drop-shadow-lg">
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

      {/* Name + badge */}
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{displayName}</h1>
        <span className="badge badge-primary">Author</span>
      </div>

      {/* Username handle */}
      {username && (
        <p className="text-sm text-base-content/50 font-mono mb-3">@{username}</p>
      )}

      {/* Member since */}
      {createdAt && (
        <p className="text-xs text-base-content/40 mb-3 font-mono">
          Member since {new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </p>
      )}

      {/* Bio */}
      {bio && (
        <p className="text-base-content/70 leading-relaxed max-w-2xl text-base border-l-2 border-primary/40 pl-4">
          {bio}
        </p>
      )}
    </div>
  )
}
