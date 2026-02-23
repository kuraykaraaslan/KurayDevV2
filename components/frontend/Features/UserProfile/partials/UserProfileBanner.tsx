interface UserProfileBannerProps {
  headerImage?: string | null
}

export default function UserProfileBanner({ headerImage }: UserProfileBannerProps) {
  return (
    <div className="relative w-full h-56 md:h-72 overflow-hidden">
      {headerImage ? (
        <img
          src={headerImage}
          alt="Profile banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 1600 400'%3E%3Cg fill-opacity='0.25'%3E%3Cpolygon fill='%23222222' points='800 50 0 100 0 400 1600 400 1600 100'/%3E%3Cpolygon fill='%23444444' points='800 100 0 200 0 400 1600 400 1600 200'/%3E%3Cpolygon fill='%23666666' points='800 150 0 300 0 400 1600 400 1600 300'/%3E%3Cpolygon fill='%23888888' points='1600 400 800 200 0 400'/%3E%3Cpolygon fill='%23aaaaaa' points='1280 400 800 250 320 400'/%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/20 to-transparent" />
    </div>
  )
}
