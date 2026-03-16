import ContactFormService from '@/services/ContactFormService'
import { prisma } from '@/libs/prisma'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    contactForm: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const prismaMock = prisma as any

const mockForm = {
  contactId: 'cf-1',
  name: 'John',
  email: 'john@example.com',
  message: 'Hello',
  phone: '+905551234567',
  createdAt: new Date(),
  deletedAt: null,
}

describe('ContactFormService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── createContactForm ─────────────────────────────────────────────────
  describe('createContactForm', () => {
    it('throws when required fields are missing', async () => {
      await expect(
        ContactFormService.createContactForm({ name: '', email: 'e@x.com', message: 'hi', phone: '' })
      ).rejects.toThrow('All fields are required.')

      await expect(
        ContactFormService.createContactForm({ name: 'N', email: '', message: 'hi', phone: '' })
      ).rejects.toThrow('All fields are required.')
    })

    it('creates contact form on valid input', async () => {
      prismaMock.contactForm.create.mockResolvedValueOnce(mockForm)

      const result = await ContactFormService.createContactForm({
        name: 'John', email: 'john@example.com', message: 'Hello', phone: '+905551234567',
      })

      expect(result.contactId).toBe('cf-1')
      expect(prismaMock.contactForm.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: 'john@example.com' }) })
      )
    })
  })

  // ── getAllContactForms ─────────────────────────────────────────────────
  describe('getAllContactForms', () => {
    it('throws for SQL injection in search', async () => {
      await expect(
        ContactFormService.getAllContactForms(0, 10, 'SELECT * FROM users')
      ).rejects.toThrow('Invalid search query.')
    })

    it('returns paginated results', async () => {
      prismaMock.contactForm.findMany.mockResolvedValueOnce([mockForm])
      prismaMock.contactForm.count.mockResolvedValueOnce(1)

      const result = await ContactFormService.getAllContactForms(0, 10)
      expect(result.contactForms).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('applies search filter when provided', async () => {
      prismaMock.contactForm.findMany.mockResolvedValueOnce([])
      prismaMock.contactForm.count.mockResolvedValueOnce(0)

      await ContactFormService.getAllContactForms(0, 10, 'john')

      const call = prismaMock.contactForm.findMany.mock.calls[0][0]
      expect(call.where.OR).toBeDefined()
    })

    it('uses valid sort key', async () => {
      prismaMock.contactForm.findMany.mockResolvedValueOnce([])
      prismaMock.contactForm.count.mockResolvedValueOnce(0)

      await ContactFormService.getAllContactForms(0, 10, undefined, 'email', 'asc')

      const call = prismaMock.contactForm.findMany.mock.calls[0][0]
      expect(call.orderBy).toEqual({ email: 'asc' })
    })
  })

  // ── getContactFormById ────────────────────────────────────────────────
  describe('getContactFormById', () => {
    it('returns form when found', async () => {
      prismaMock.contactForm.findFirst.mockResolvedValueOnce(mockForm)
      const result = await ContactFormService.getContactFormById('cf-1')
      expect(result?.contactId).toBe('cf-1')
    })

    it('returns null when not found', async () => {
      prismaMock.contactForm.findFirst.mockResolvedValueOnce(null)
      const result = await ContactFormService.getContactFormById('missing')
      expect(result).toBeNull()
    })
  })

  // ── getRecentContactFormEntriesByPhoneOrEmail ─────────────────────────
  describe('getRecentContactFormEntriesByPhoneOrEmail', () => {
    it('queries by phone or email within 24 hours', async () => {
      prismaMock.contactForm.findMany.mockResolvedValueOnce([mockForm])

      const result = await ContactFormService.getRecentContactFormEntriesByPhoneOrEmail(
        '+905551234567', 'john@example.com'
      )

      const call = prismaMock.contactForm.findMany.mock.calls[0][0]
      expect(result).toHaveLength(1)
      expect(call.where.OR).toEqual([
        { phone: '+905551234567' },
        { email: 'john@example.com' },
      ])
      expect(call.where.createdAt.gte).toBeDefined()
    })
  })

  // ── isRateLimited ─────────────────────────────────────────────────────
  describe('isRateLimited', () => {
    it('returns true when recent entries exceed threshold', async () => {
      prismaMock.contactForm.findMany.mockResolvedValueOnce([mockForm, mockForm, mockForm])

      const result = await ContactFormService.isRateLimited('+905551234567', 'john@example.com')
      expect(result).toBe(true)
    })

    it('returns false when recent entries are within threshold', async () => {
      prismaMock.contactForm.findMany.mockResolvedValueOnce([mockForm, mockForm])

      const result = await ContactFormService.isRateLimited('+905551234567', 'john@example.com')
      expect(result).toBe(false)
    })
  })

  // ── deleteContactForm ─────────────────────────────────────────────────
  describe('deleteContactForm', () => {
    it('returns null when form not found', async () => {
      prismaMock.contactForm.findFirst.mockResolvedValueOnce(null)
      const result = await ContactFormService.deleteContactForm('missing')
      expect(result).toBeNull()
    })

    it('soft-deletes by setting deletedAt', async () => {
      prismaMock.contactForm.findFirst.mockResolvedValueOnce(mockForm)
      prismaMock.contactForm.update.mockResolvedValueOnce({})

      await ContactFormService.deleteContactForm('cf-1')

      expect(prismaMock.contactForm.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contactId: 'cf-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      )
    })
  })
})
