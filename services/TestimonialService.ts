import { Testimonial } from '@/types/ui/TestimonialTypes'
import { prisma } from '@/libs/prisma'

export default class TestimonialService {
  private static sqlInjectionRegex =
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)|(--)|(\b(AND|OR|NOT|IS|NULL|LIKE|IN|BETWEEN|EXISTS|CASE|WHEN|THEN|END|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|HAVING|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET)\b)/i

  static async createTestimonial(data: {
    name: string
    title: string
    review: string
    image?: string
    status?: string
  }): Promise<Testimonial> {
    const { name, title, review, image, status } = data

    if (!name || !title || !review) {
      throw new Error('Name, title, and review are required.')
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        title,
        review,
        image: image || null,
        status: status || 'PUBLISHED',
      },
    })

    return testimonial as Testimonial
  }

  static async getAllTestimonials(
    page: number,
    pageSize: number,
    search?: string
  ): Promise<{ testimonials: Testimonial[]; total: number }> {
    if (search && this.sqlInjectionRegex.test(search)) {
      throw new Error('Invalid search query.')
    }

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { title: { contains: search } },
            { review: { contains: search } },
          ],
        }
      : {}

    const [testimonials, total] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        skip: page * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.testimonial.count({ where }),
    ])

    return { testimonials: testimonials as Testimonial[], total }
  }

  static async getTestimonialById(testimonialId: string): Promise<Testimonial | null> {
    const testimonial = await prisma.testimonial.findUnique({
      where: { testimonialId },
    })
    return testimonial as Testimonial | null
  }

  static async updateTestimonial(data: {
    testimonialId: string
    name: string
    title: string
    review: string
    image?: string
    status?: string
  }): Promise<Testimonial> {
    const { testimonialId, name, title, review, image, status } = data

    const testimonial = await prisma.testimonial.update({
      where: { testimonialId },
      data: {
        name,
        title,
        review,
        image: image || null,
        status: status || 'PUBLISHED',
      },
    })

    return testimonial as Testimonial
  }

  static async deleteTestimonial(testimonialId: string): Promise<Testimonial> {
    const testimonial = await prisma.testimonial.delete({
      where: { testimonialId },
    })
    return testimonial as Testimonial
  }

  static async getPublishedTestimonials(): Promise<Testimonial[]> {
    const testimonials = await prisma.testimonial.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    })
    return testimonials as Testimonial[]
  }
}
