import { NextResponse } from 'next/server'
import ShortLinkService from '@/services/ShortLinkService'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import { CreateShortLinkRequestSchema } from '@/dtos/ShortLinkDTO'

const NEXT_PUBLIC_APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST || 'http://localhost:3000'

/**
 * GET /api/links
 * Returns all short links (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)
    const search = searchParams.get('search') || undefined
    const sortKey = searchParams.get('sortKey') || undefined
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'
    const { links, total } = await ShortLinkService.getAll({ page, pageSize, search, sortKey, sortDir })
    return NextResponse.json({ links, total, page, pageSize })
  } catch (error: any) {
    console.error(error.message)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/**
 * POST /api/links
 * Body: { url: string }
 * Returns: { code, shortUrl }
 *
 * Anyone can shorten URLs within the app host.
 * External URLs require ADMIN role.
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'GUEST' })

    const body = await request.json()

    const parsedData = CreateShortLinkRequestSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        { message: parsedData.error.errors.map((err) => err.message).join(', ') },
        { status: 400 }
      )
    }

    const { url } = parsedData.data
    const isExternal = !url.startsWith(NEXT_PUBLIC_APPLICATION_HOST)

    if (isExternal) {
      if (!user || (user.userRole !== 'ADMIN' && user.userRole !== 'AUTHOR')) {
        return NextResponse.json(
          { message: 'Only admins can shorten external URLs' },
          { status: 403 }
        )
      }
    }

    const code = await ShortLinkService.getOrCreate(url)
    const shortUrl = `${NEXT_PUBLIC_APPLICATION_HOST}/s/${code}`

    return NextResponse.json({ code, shortUrl })
  } catch (error: any) {
    console.error(error.message)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
