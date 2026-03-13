import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Newsletter from '@/components/frontend/Features/Newsletter'
import MetadataHelper from '@/helpers/MetadataHelper'
import UserService from '@/services/UserService'
import ToastContainerClient from '@/components/common/UI/Toast/ToastContainerClient'
import 'react-toastify/dist/ReactToastify.css'
import Feed from '@/components/frontend/Features/Blog/Feed'
import { AVAILABLE_LANGUAGES } from '@/types/common/I18nTypes'
import { buildAlternates, buildLangUrl, getOgLocale } from '@/helpers/HreflangHelper'
import { getDictionary } from '@/libs/localize/getDictionary'

const NEXT_PUBLIC_APPLICATION_HOST =
  process.env.NEXT_PUBLIC_APPLICATION_HOST || 'http://localhost:3000'

type Props = {
  params: Promise<{ lang: string; username: string }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function resolveDisplayName(user: NonNullable<Awaited<ReturnType<typeof getUser>>>): string {
  const rawName = user.userProfile?.name || user.name
  const username = user.userProfile?.username
  const safeName = rawName && !looksLikeEmail(rawName) ? rawName : null
  const emailLocalPart = user.email.split('@')[0]
  return safeName || username || emailLocalPart || user.userId
}

function getDictString(source: unknown, path: readonly string[], fallback: string): string {
  let current: unknown = source
  for (const key of path) {
    if (!isRecord(current)) return fallback
    current = current[key]
  }
  return typeof current === 'string' ? current : fallback
}

async function getUser(username: string) {
  try {
    const response = await UserService.getByUsernameOrId(username)
    if (!response) return null
    if (response.userStatus !== 'ACTIVE') return null
    if (response.userRole !== 'ADMIN' && response.userRole !== 'AUTHOR') return null
    return response
  } catch {
    return null
  }
}

function getProfileSlug(user: Awaited<ReturnType<typeof getUser>>) {
  if (!user) return ''
  return user.userProfile?.username ?? user.userId
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, username } = await params
  const user = await getUser(username)

  if (!user) return {}

  const slug = getProfileSlug(user)
  const path = `/users/${slug}`
  const { canonical, languages } = buildAlternates(lang, path, [...AVAILABLE_LANGUAGES])
  const dict = await getDictionary(lang)
  const postsBy = getDictString(dict, ['frontend', 'feed', 'posts_by'], 'Posts by')
  const displayName = resolveDisplayName(user)
  const description = user.userProfile?.biography || `${postsBy} ${displayName}`
  const image = user.userProfile?.profilePicture || `${NEXT_PUBLIC_APPLICATION_HOST}/assets/img/og.png`
  const hideFromIndex = user.userProfile?.hideProfileFromIndex ?? true

  return {
    title: `${displayName} | Kuray Karaaslan`,
    description,
    robots: hideFromIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    authors: [{ name: displayName, url: canonical }],
    openGraph: {
      title: `${displayName} | Kuray Karaaslan`,
      description,
      type: 'profile',
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: displayName }],
      locale: getOgLocale(lang),
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
    alternates: { canonical, languages },
  }
}

export default async function UserProfilePage({ params }: Props) {
  try {
    const { lang, username } = await params
    if (!username) notFound()

    const user = await getUser(username)
    if (!user) notFound()

    const slug = getProfileSlug(user)
    const path = `/users/${slug}`
    const url = buildLangUrl(lang, path)
    const dict = await getDictionary(lang)
    const postsBy = getDictString(dict, ['frontend', 'feed', 'posts_by'], 'Posts by')
    const displayName = resolveDisplayName(user)
    const description = user.userProfile?.biography || `${postsBy} ${displayName}`

    const jsonLdMeta: Metadata = {
      title: `${displayName} | Kuray Karaaslan`,
      description,
      openGraph: {
        title: `${displayName} | Kuray Karaaslan`,
        description,
        type: 'profile',
        url,
        images: [user.userProfile?.profilePicture || `${NEXT_PUBLIC_APPLICATION_HOST}/assets/img/og.png`],
      },
    }

    const feedAuthor = {
      userId: user.userId,
      name: user.name,
      userProfile: {
        ...user.userProfile,
        name: displayName,
      },
    }

    return (
      <>
        {MetadataHelper.generateJsonLdScripts(jsonLdMeta)}
        <Feed author={feedAuthor} />
        <Newsletter />
        <ToastContainerClient />
      </>
    )
  } catch (error) {
    console.error('Error fetching user:', error)
    notFound()
  }
}
