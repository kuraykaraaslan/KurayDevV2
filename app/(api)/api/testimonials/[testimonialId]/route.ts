import { NextResponse } from 'next/server'
import TestimonialService from '@/services/TestimonialService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import TestimonialMessages from '@/messages/TestimonialMessages'
import { UpdateTestimonialRequestSchema } from '@/dtos/TestimonialDTO'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ testimonialId: string }> }
) {
  try {
    const { testimonialId } = await params
    const testimonial = await TestimonialService.getTestimonialById(testimonialId)

    if (!testimonial) {
      return NextResponse.json({ message: TestimonialMessages.TESTIMONIAL_NOT_FOUND }, { status: 404 })
    }

    return NextResponse.json({ message: TestimonialMessages.TESTIMONIAL_RETRIEVED, testimonial })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ testimonialId: string }> }
) {
  try {
    await UserSessionService.authenticateUserByRequest({ request })

    const { testimonialId } = await params

    const data = await request.json()
    data.testimonialId = testimonialId

    const parsedData = UpdateTestimonialRequestSchema.safeParse(data)

    if (!parsedData.success) {
      return NextResponse.json(
        { error: parsedData.error.errors.map((err) => err.message).join(', ') },
        { status: 400 }
      )
    }

    const testimonial = await TestimonialService.updateTestimonial(parsedData.data)

    return NextResponse.json({ testimonial })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ testimonialId: string }> }
) {
  try {
    await UserSessionService.authenticateUserByRequest({ request })

    const { testimonialId } = await params
    const testimonial = await TestimonialService.getTestimonialById(testimonialId)

    if (!testimonial) {
      return NextResponse.json({ message: TestimonialMessages.TESTIMONIAL_NOT_FOUND }, { status: 404 })
    }

    await TestimonialService.deleteTestimonial(testimonialId)

    return NextResponse.json({ message: TestimonialMessages.TESTIMONIAL_DELETED_SUCCESSFULLY })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
