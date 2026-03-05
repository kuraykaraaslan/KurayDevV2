import { NextResponse } from 'next/server'
import ShortLinkService from '@/services/ShortLinkService'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import { UpdateShortLinkRequestSchema } from '@/dtos/ShortLinkDTO'

/**
 * GET /api/links/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })
    const { id } = await params
    const link = await ShortLinkService.getById(id)
    if (!link) return NextResponse.json({ message: 'Not found' }, { status: 404 })
    return NextResponse.json({ link })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/links/[id]
 * Body: { originalUrl?: string, code?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })
    const { id } = await params
    const body = await request.json()

    const parsedData = UpdateShortLinkRequestSchema.safeParse(body)
    if (!parsedData.success) {
      return NextResponse.json(
        { message: parsedData.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      )
    }

    const link = await ShortLinkService.update(id, parsedData.data)
    return NextResponse.json({ link })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/links/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })
    const { id } = await params
    await ShortLinkService.delete(id)
    return NextResponse.json({ message: 'Deleted' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
