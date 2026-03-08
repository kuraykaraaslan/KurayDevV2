import { NextResponse } from 'next/server'
import TestimonialService from '@/services/TestimonialService'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import { CreateTestimonialRequestSchema } from '@/dtos/TestimonialDTO'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = searchParams.get('page') ? parseInt(searchParams.get('page') || '0', 10) : 0
    const pageSize = searchParams.get('pageSize')
      ? parseInt(searchParams.get('pageSize') || '10', 10)
      : 10
    const search = searchParams.get('search') || undefined
    const sortKey = searchParams.get('sortKey') || undefined
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'

    const result = await TestimonialService.getAllTestimonials(page, pageSize, search, sortKey, sortDir)

    return NextResponse.json({ testimonials: result.testimonials, total: result.total })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request })

    const body = await request.json()

    const parsedData = CreateTestimonialRequestSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        { message: parsedData.error.errors.map((err) => err.message).join(', ') },
        { status: 400 }
      )
    }

    const testimonial = await TestimonialService.createTestimonial(parsedData.data)

    return NextResponse.json({ testimonial })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
