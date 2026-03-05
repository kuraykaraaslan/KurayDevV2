import { NextResponse } from 'next/server'
import SeriesService from '@/services/PostService/SeriesService'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'

type Ctx = { params: Promise<{ seriesId: string; postId: string }> }

export async function DELETE(request: NextRequest, { params }: Ctx) {
    try {
        await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })
        const { postId } = await params
        await SeriesService.removePost(postId)
        return NextResponse.json({ message: 'Removed from series' })
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
