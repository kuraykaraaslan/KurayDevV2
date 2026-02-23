import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Newsletter from '@/components/frontend/Features/Newsletter'
import MetadataHelper from '@/helpers/MetadataHelper'
import UserService from '@/services/UserService'
import { ToastContainer } from 'react-toastify'
import Feed from '@/components/frontend/Features/Blog/Feed'
import UserProfile from '@/components/frontend/Features/UserProfile'

const APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST

async function getUser(username: string) {
  try {
    const response = await UserService.getByUsernameOrId(username)
    if (!response || response.userRole !== 'ADMIN') return null
    return response
  } catch {
    return null
  }
}

function getProfileSlug(user: Awaited<ReturnType<typeof getUser>>) {
  if (!user) return ''
  return user.userProfile?.username ?? user.userId
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const user = await getUser(username)

  if (!user) return {}

  const slug = getProfileSlug(user)
  const url = `${APPLICATION_HOST}/users/${slug}`
  const displayName = user.userProfile?.name || user.name || 'Author'
  const description = user.userProfile?.biography || `Posts by ${displayName}`
  const image = user.userProfile?.profilePicture || `${APPLICATION_HOST}/assets/img/og.png`
  const hideFromIndex = user.userProfile?.hideProfileFromIndex ?? true

  return {
    title: `${displayName} | Kuray Karaaslan`,
    description,
    robots: hideFromIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    authors: [{ name: displayName, url }],
    openGraph: {
      title: `${displayName} | Kuray Karaaslan`,
      description,
      type: 'profile',
      url,
      images: [{ url: image, width: 1200, height: 630, alt: displayName }],
      locale: 'en_US',
      siteName: 'Kuray Karaaslan',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@kuraykaraaslan',
      creator: '@kuraykaraaslan',
      title: `${displayName} | Kuray Karaaslan`,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params
    if (!username) notFound()

    const user = await getUser(username)
    if (!user) notFound()

    const slug = getProfileSlug(user)
    const url = `${APPLICATION_HOST}/users/${slug}`
    const displayName = user.userProfile?.name || user.name || 'Author'
    const description = user.userProfile?.biography || `Posts by ${displayName}`

    const jsonLdMeta: Metadata = {
      title: `${displayName} | Kuray Karaaslan`,
      description,
      openGraph: {
        title: `${displayName} | Kuray Karaaslan`,
        description,
        type: 'profile',
        url,
        images: [user.userProfile?.profilePicture || `${APPLICATION_HOST}/assets/img/og.png`],
      },
    }

    return (
      <>
        {MetadataHelper.generateJsonLdScripts(jsonLdMeta)}

        <UserProfile user={user} />

        <div className="-mt-16">
          <Feed author={user} />
        </div>

        <Newsletter />
        <ToastContainer />
      </>
    )
  } catch (error) {
    console.error('Error fetching user:', error)
    notFound()
  }
}
