import { NextResponse } from 'next/server'
import SeriesService from '@/services/PostService/SeriesService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { CreateSeriesRequestSchema } from '@/dtos/SeriesDTO'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page     = parseInt(searchParams.get('page')     || '0',  10)
        const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
        const search   = searchParams.get('search') || undefined

        const result = await SeriesService.getAll(page, pageSize, search)
        return NextResponse.json({ series: result.series, total: result.total, page, pageSize })
    } catch (error: any) {
        console.error(error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

        const body   = await request.json()
        const parsed = CreateSeriesRequestSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { message: parsed.error.errors.map((e) => e.message).join(', ') },
                { status: 400 }
            )
        }

        const series = await SeriesService.create(parsed.data)
        return NextResponse.json({ series }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
