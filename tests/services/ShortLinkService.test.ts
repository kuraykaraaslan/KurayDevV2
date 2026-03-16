import ShortLinkService from '@/services/ShortLinkService'
import { prisma } from '@/libs/prisma'
import redis from '@/libs/redis'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    shortLink: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    shortLinkClick: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/services/UserAgentService', () => ({
  __esModule: true,
  default: { parseRequest: jest.fn().mockResolvedValue({ ip: '1.1.1.1', country: 'US', city: 'NY', os: 'Mac', browser: 'Chrome', device: 'Desktop' }) },
}))

const prismaMock = prisma as any
const redisMock = redis as jest.Mocked<typeof redis>

const mockLink = {
  id: 'link-1',
  code: 'abc123',
  originalUrl: 'https://example.com/long-url',
  createdAt: new Date(),
  deletedAt: null,
}

describe('ShortLinkService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── generateCode ─────────────────────────────────────────────────────
  describe('generateCode', () => {
    it('returns a 6-character alphanumeric code', () => {
      const code = ShortLinkService.generateCode()
      expect(code).toMatch(/^[a-zA-Z0-9]{6}$/)
    })

    it('generates unique codes on successive calls', () => {
      const codes = new Set(Array.from({ length: 50 }, () => ShortLinkService.generateCode()))
      expect(codes.size).toBeGreaterThan(1)
    })
  })

  // ── getOrCreate ───────────────────────────────────────────────────────
  describe('getOrCreate', () => {
    it('returns existing code when link already exists', async () => {
      prismaMock.shortLink.findFirst.mockResolvedValueOnce(mockLink)
      const code = await ShortLinkService.getOrCreate('https://example.com/long-url')
      expect(code).toBe('abc123')
      expect(prismaMock.shortLink.create).not.toHaveBeenCalled()
    })

    it('creates new short link when none exists', async () => {
      prismaMock.shortLink.findFirst.mockResolvedValueOnce(null)
      prismaMock.shortLink.findUnique.mockResolvedValueOnce(null) // no conflict
      prismaMock.shortLink.create.mockResolvedValueOnce({ ...mockLink, code: 'newcod' })

      const code = await ShortLinkService.getOrCreate('https://example.com/new-url')
      expect(prismaMock.shortLink.create).toHaveBeenCalled()
      expect(typeof code).toBe('string')
    })

    it('is idempotent for duplicate getOrCreate commands on same URL', async () => {
      prismaMock.shortLink.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockLink, code: 'same01' })
      prismaMock.shortLink.findUnique.mockResolvedValueOnce(null)
      prismaMock.shortLink.create.mockResolvedValueOnce({ ...mockLink, code: 'same01' })

      const firstCode = await ShortLinkService.getOrCreate('https://example.com/idempotent')
      const secondCode = await ShortLinkService.getOrCreate('https://example.com/idempotent')

      expect(firstCode).toBe('same01')
      expect(secondCode).toBe('same01')
      expect(prismaMock.shortLink.create).toHaveBeenCalledTimes(1)
    })

    it('rejects unsupported URL protocols via allowlist', async () => {
      await expect(ShortLinkService.getOrCreate('javascript:alert(1)')).rejects.toThrow(
        'Unsupported URL protocol: javascript:'
      )

      expect(prismaMock.shortLink.findFirst).not.toHaveBeenCalled()
      expect(prismaMock.shortLink.create).not.toHaveBeenCalled()
    })
  })

  // ── resolve ───────────────────────────────────────────────────────────
  describe('resolve', () => {
    it('returns null for unknown code', async () => {
      prismaMock.shortLink.findFirst.mockResolvedValueOnce(null)
      const result = await ShortLinkService.resolve('badcode')
      expect(result).toBeNull()
    })

    it('returns originalUrl for valid code', async () => {
      prismaMock.shortLink.findFirst.mockResolvedValueOnce(mockLink)
      const result = await ShortLinkService.resolve('abc123')
      expect(result).toBe('https://example.com/long-url')
    })

    it('applies rate limiting and buffers click when request has IP', async () => {
      prismaMock.shortLink.findFirst.mockResolvedValueOnce(mockLink)
      redisMock.incr.mockResolvedValueOnce(1)
      redisMock.expire.mockResolvedValueOnce(1)
      redisMock.rpush.mockResolvedValueOnce(1)

      const mockRequest = {
        headers: { get: (h: string) => h === 'x-forwarded-for' ? '1.1.1.1' : null },
      } as unknown as NextRequest

      const result = await ShortLinkService.resolve('abc123', mockRequest)
      expect(result).toBe('https://example.com/long-url')
      expect(redisMock.rpush).toHaveBeenCalledWith(
        'click:buffer',
        expect.any(String)
      )
    })

    it('skips tracking when rate limit exceeded', async () => {
      prismaMock.shortLink.findFirst.mockResolvedValueOnce(mockLink)
      redisMock.incr.mockResolvedValueOnce(11) // > CLICK_RATE_LIMIT (10)
      redisMock.expire.mockResolvedValueOnce(1)

      const mockRequest = {
        headers: { get: (h: string) => h === 'x-forwarded-for' ? '9.9.9.9' : null },
      } as unknown as NextRequest

      await ShortLinkService.resolve('abc123', mockRequest)
      expect(redisMock.rpush).not.toHaveBeenCalled()
    })

    it('returns originalUrl even when redis tracking fails (safe fallback)', async () => {
      prismaMock.shortLink.findFirst.mockResolvedValueOnce(mockLink)
      redisMock.incr.mockRejectedValueOnce(new Error('redis unavailable'))

      const mockRequest = {
        headers: { get: (h: string) => (h === 'x-forwarded-for' ? '2.2.2.2' : null) },
      } as unknown as NextRequest

      await expect(ShortLinkService.resolve('abc123', mockRequest)).resolves.toBe(
        'https://example.com/long-url'
      )
    })

    it('returns null for links with disallowed target protocols', async () => {
      prismaMock.shortLink.findFirst.mockResolvedValueOnce({
        ...mockLink,
        originalUrl: 'data:text/html;base64,SGVsbG8=',
      })

      const result = await ShortLinkService.resolve('abc123')
      expect(result).toBeNull()
      expect(redisMock.rpush).not.toHaveBeenCalled()
    })
  })

  // ── getAll ────────────────────────────────────────────────────────────
  describe('getAll', () => {
    it('returns paginated links and total', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[mockLink], 1])
      const result = await ShortLinkService.getAll({ page: 0, pageSize: 10 })
      expect(result.links).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })

  // ── getById ───────────────────────────────────────────────────────────
  describe('getById', () => {
    it('returns link when found', async () => {
      prismaMock.shortLink.findFirst.mockResolvedValueOnce(mockLink)
      const result = await ShortLinkService.getById('link-1')
      expect(result?.id).toBe('link-1')
    })
  })

  // ── update ────────────────────────────────────────────────────────────
  describe('update', () => {
    it('calls prisma update with correct data', async () => {
      prismaMock.shortLink.update.mockResolvedValueOnce(mockLink)
      await ShortLinkService.update('link-1', { originalUrl: 'https://new.com' })
      expect(prismaMock.shortLink.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'link-1' } })
      )
    })

    it('rejects update when URL protocol is not allowlisted', async () => {
      await expect(
        ShortLinkService.update('link-1', { originalUrl: 'javascript:alert(1)' })
      ).rejects.toThrow('Unsupported URL protocol: javascript:')

      expect(prismaMock.shortLink.update).not.toHaveBeenCalled()
    })
  })

  // ── delete ────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('soft-deletes by setting deletedAt', async () => {
      prismaMock.shortLink.update.mockResolvedValueOnce({})
      await ShortLinkService.delete('link-1')
      expect(prismaMock.shortLink.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'link-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      )
    })
  })

  // ── getAnalytics ──────────────────────────────────────────────────────
  describe('getAnalytics', () => {
    it('returns null when link not found', async () => {
      prismaMock.shortLink.findFirst.mockResolvedValueOnce(null)
      const result = await ShortLinkService.getAnalytics('missing')
      expect(result).toBeNull()
    })

    it('returns analytics with aggregated counts', async () => {
      prismaMock.shortLink.findFirst.mockResolvedValueOnce(mockLink)
      prismaMock.shortLinkClick.findMany.mockResolvedValueOnce([
        { clickedAt: new Date('2024-03-10T10:00:00Z'), referrer: 'google.com', country: 'US', city: 'NY', os: 'Mac', browser: 'Chrome', device: 'Desktop' },
        { clickedAt: new Date('2024-03-10T11:00:00Z'), referrer: null, country: 'TR', city: 'Istanbul', os: 'Windows', browser: 'Firefox', device: 'Desktop' },
      ])

      const result = await ShortLinkService.getAnalytics('link-1')
      expect(result?.totalClicks).toBe(2)
      expect(result?.byCountry).toBeDefined()
      expect(result?.byBrowser).toBeDefined()
    })
  })
})
