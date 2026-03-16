import TestimonialService from '@/services/TestimonialService'
import { prisma } from '@/libs/prisma'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    testimonial: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const prismaMock = prisma as any

const mockTestimonial = {
  testimonialId: 'test-1',
  name: 'John Doe',
  title: 'CEO',
  review: 'Great service!',
  image: null,
  status: 'PUBLISHED',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

describe('TestimonialService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── createTestimonial ─────────────────────────────────────────────────
  describe('createTestimonial', () => {
    it('throws when name, title, or review is missing', async () => {
      await expect(
        TestimonialService.createTestimonial({ name: '', title: 'CEO', review: 'Great' })
      ).rejects.toThrow('Name, title, and review are required.')

      await expect(
        TestimonialService.createTestimonial({ name: 'John', title: '', review: 'Great' })
      ).rejects.toThrow('Name, title, and review are required.')
    })

    it('creates testimonial with default status PUBLISHED', async () => {
      prismaMock.testimonial.create.mockResolvedValueOnce(mockTestimonial)

      const result = await TestimonialService.createTestimonial({
        name: 'John Doe', title: 'CEO', review: 'Great service!',
      })

      expect(prismaMock.testimonial.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PUBLISHED' }),
        })
      )
      expect(result.testimonialId).toBe('test-1')
    })

    it('creates testimonial with provided status', async () => {
      prismaMock.testimonial.create.mockResolvedValueOnce({ ...mockTestimonial, status: 'DRAFT' })

      await TestimonialService.createTestimonial({
        name: 'Jane', title: 'CTO', review: 'Excellent', status: 'DRAFT',
      })

      expect(prismaMock.testimonial.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'DRAFT' }),
        })
      )
    })
  })

  // ── getAllTestimonials ─────────────────────────────────────────────────
  describe('getAllTestimonials', () => {
    it('throws for SQL injection attempt in search', async () => {
      await expect(
        TestimonialService.getAllTestimonials(0, 10, 'SELECT * FROM users')
      ).rejects.toThrow('Invalid search query.')
    })

    it('returns testimonials and total', async () => {
      prismaMock.testimonial.findMany.mockResolvedValueOnce([mockTestimonial])
      prismaMock.testimonial.count.mockResolvedValueOnce(1)

      const result = await TestimonialService.getAllTestimonials(0, 10)
      expect(result.testimonials).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('applies search filter when provided', async () => {
      prismaMock.testimonial.findMany.mockResolvedValueOnce([])
      prismaMock.testimonial.count.mockResolvedValueOnce(0)

      await TestimonialService.getAllTestimonials(0, 10, 'great')

      const findManyCall = prismaMock.testimonial.findMany.mock.calls[0][0]
      expect(findManyCall.where.OR).toBeDefined()
    })

    it('applies pagination via skip/take', async () => {
      prismaMock.testimonial.findMany.mockResolvedValueOnce([])
      prismaMock.testimonial.count.mockResolvedValueOnce(0)

      await TestimonialService.getAllTestimonials(2, 5)

      const findManyCall = prismaMock.testimonial.findMany.mock.calls[0][0]
      expect(findManyCall.skip).toBe(10) // 2 * 5
      expect(findManyCall.take).toBe(5)
    })

    it('uses custom sort key when valid', async () => {
      prismaMock.testimonial.findMany.mockResolvedValueOnce([])
      prismaMock.testimonial.count.mockResolvedValueOnce(0)

      await TestimonialService.getAllTestimonials(0, 10, undefined, 'name', 'asc')

      const findManyCall = prismaMock.testimonial.findMany.mock.calls[0][0]
      expect(findManyCall.orderBy).toEqual({ name: 'asc' })
    })

    it('falls back to createdAt for unknown sort key', async () => {
      prismaMock.testimonial.findMany.mockResolvedValueOnce([])
      prismaMock.testimonial.count.mockResolvedValueOnce(0)

      await TestimonialService.getAllTestimonials(0, 10, undefined, 'invalid_key')

      const findManyCall = prismaMock.testimonial.findMany.mock.calls[0][0]
      expect(findManyCall.orderBy).toEqual({ createdAt: 'desc' })
    })
  })

  // ── getTestimonialById ────────────────────────────────────────────────
  describe('getTestimonialById', () => {
    it('returns testimonial when found', async () => {
      prismaMock.testimonial.findFirst.mockResolvedValueOnce(mockTestimonial)

      const result = await TestimonialService.getTestimonialById('test-1')
      expect(result?.testimonialId).toBe('test-1')
    })

    it('returns null when not found', async () => {
      prismaMock.testimonial.findFirst.mockResolvedValueOnce(null)

      const result = await TestimonialService.getTestimonialById('nonexistent')
      expect(result).toBeNull()
    })
  })

  // ── updateTestimonial ─────────────────────────────────────────────────
  describe('updateTestimonial', () => {
    it('calls update with correct data', async () => {
      prismaMock.testimonial.update.mockResolvedValueOnce(mockTestimonial)

      await TestimonialService.updateTestimonial({
        testimonialId: 'test-1', name: 'Updated', title: 'CTO', review: 'Updated review',
      })

      expect(prismaMock.testimonial.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { testimonialId: 'test-1' } })
      )
    })
  })

  // ── deleteTestimonial ─────────────────────────────────────────────────
  describe('deleteTestimonial', () => {
    it('soft-deletes by setting deletedAt', async () => {
      prismaMock.testimonial.update.mockResolvedValueOnce({ ...mockTestimonial, deletedAt: new Date() })

      await TestimonialService.deleteTestimonial('test-1')

      expect(prismaMock.testimonial.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { testimonialId: 'test-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      )
    })
  })

  // ── getPublishedTestimonials ──────────────────────────────────────────
  describe('getPublishedTestimonials', () => {
    it('queries only PUBLISHED and non-deleted records', async () => {
      prismaMock.testimonial.findMany.mockResolvedValueOnce([mockTestimonial])

      const result = await TestimonialService.getPublishedTestimonials()
      expect(result).toHaveLength(1)

      const findManyCall = prismaMock.testimonial.findMany.mock.calls[0][0]
      expect(findManyCall.where).toEqual({ status: 'PUBLISHED', deletedAt: null })
    })
  })
})
