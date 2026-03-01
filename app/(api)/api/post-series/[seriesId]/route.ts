import { NextResponse } from 'next/server'
import SeriesService from '@/services/PostService/SeriesService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { SeriesIdParamSchema, UpdateSeriesRequestSchema } from '@/dtos/SeriesDTO'

type Ctx = { params: Promise<{ seriesId: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
    try {
        const { seriesId } = SeriesIdParamSchema.parse(await params)
        const series = await SeriesService.getById(seriesId)
        if (!series) return NextResponse.json({ message: 'Not found' }, { status: 404 })
        return NextResponse.json({ series })
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
    try {
        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

        const { seriesId } = SeriesIdParamSchema.parse(await params)
        const body   = await request.json()
        const parsed = UpdateSeriesRequestSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { message: parsed.error.errors.map((e) => e.message).join(', ') },
                { status: 400 }
            )
        }

        const series = await SeriesService.update(seriesId, parsed.data)
        return NextResponse.json({ series })
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
    try {
        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })
        const { seriesId } = SeriesIdParamSchema.parse(await params)
        await SeriesService.delete(seriesId)
        return NextResponse.json({ message: 'Deleted' })
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
