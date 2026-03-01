import { NextResponse } from 'next/server'
import SeriesService from '@/services/PostService/SeriesService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { SeriesIdParamSchema, AddSeriesEntrySchema, ReorderSeriesEntriesSchema } from '@/dtos/SeriesDTO'

type Ctx = { params: Promise<{ seriesId: string }> }

/** Add a post to the series */
export async function POST(request: NextRequest, { params }: Ctx) {
    try {
        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

        const { seriesId } = SeriesIdParamSchema.parse(await params)
        const body   = await request.json()
        const parsed = AddSeriesEntrySchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { message: parsed.error.errors.map((e) => e.message).join(', ') },
                { status: 400 }
            )
        }

        const entry = await SeriesService.addPost(seriesId, parsed.data.postId, parsed.data.order)
        return NextResponse.json({ entry }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}

/** Bulk-reorder entries */
export async function PUT(request: NextRequest, { params }: Ctx) {
    try {
        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

        const { seriesId } = SeriesIdParamSchema.parse(await params)
        const body   = await request.json()
        const parsed = ReorderSeriesEntriesSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { message: parsed.error.errors.map((e) => e.message).join(', ') },
                { status: 400 }
            )
        }

        const series = await SeriesService.reorderPosts(seriesId, parsed.data.entries)
        return NextResponse.json({ series })
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
