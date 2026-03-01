import { NextResponse } from 'next/server'
import ShortLinkService from '@/services/ShortLinkService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { ShortLinkIdParamSchema } from '@/dtos/ShortLinkDTO'

/**
 * GET /api/links/[id]/analytics
 * Returns aggregated click analytics for a short link (admin only).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'ADMIN',
    })

    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const raw = await params
    const parsed = ShortLinkIdParamSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid ID', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const analytics = await ShortLinkService.getAnalytics(parsed.data.id)
    if (!analytics) {
      return NextResponse.json({ message: 'Short link not found' }, { status: 404 })
    }

    return NextResponse.json({ analytics })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
