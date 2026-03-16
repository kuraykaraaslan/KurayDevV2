import { flushClickBuffer } from '@/services/CronService/jobs/flushClickBuffer'
import { prisma } from '@/libs/prisma'
import redis from '@/libs/redis'

const mockPipeline = {
  lrange: jest.fn(),
  ltrim: jest.fn(),
  exec: jest.fn(),
}

jest.mock('@/libs/prisma', () => ({
  prisma: {
    shortLinkClick: {
      createMany: jest.fn(),
    },
    shortLink: {
      update: jest.fn(),
    },
  },
}))

jest.mock('@/libs/redis', () => ({
  set: jest.fn(),
  del: jest.fn(),
  pipeline: jest.fn(() => mockPipeline),
}))

jest.mock('@/libs/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}))

const prismaMock = prisma as any
const redisMock = redis as any

describe('flushClickBuffer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPipeline.lrange.mockReturnValue(mockPipeline)
    mockPipeline.ltrim.mockReturnValue(mockPipeline)
  })

  it('skips flush when distributed lock is not acquired', async () => {
    redisMock.set.mockResolvedValueOnce(null)

    await flushClickBuffer()

    expect(redisMock.pipeline).not.toHaveBeenCalled()
    expect(prismaMock.shortLinkClick.createMany).not.toHaveBeenCalled()
    expect(prismaMock.shortLink.update).not.toHaveBeenCalled()
  })

  it('does nothing when buffer is empty and still releases lock', async () => {
    redisMock.set.mockResolvedValueOnce('OK')
    redisMock.del.mockResolvedValue(1)
    mockPipeline.exec.mockResolvedValueOnce([[null, []], [null, 0]])

    await flushClickBuffer()

    expect(prismaMock.shortLinkClick.createMany).not.toHaveBeenCalled()
    expect(prismaMock.shortLink.update).not.toHaveBeenCalled()
    expect(redisMock.del).toHaveBeenCalledWith('click:buffer:flush:lock')
  })

  it('prevents duplicate processing when two flushes run concurrently', async () => {
    const rawEvent = JSON.stringify({
      shortLinkId: 'link-1',
      referrer: 'google.com',
      ip: '1.1.1.1',
      country: 'US',
      city: 'NY',
      os: 'Mac',
      browser: 'Chrome',
      device: 'Desktop',
      clickedAt: '2026-03-16T12:00:00.000Z',
    })

    redisMock.set
      .mockResolvedValueOnce('OK')
      .mockResolvedValueOnce(null)
    redisMock.del.mockResolvedValue(1)

    mockPipeline.exec.mockResolvedValueOnce([[null, [rawEvent]], [null, 1]])

    prismaMock.shortLinkClick.createMany.mockResolvedValueOnce({ count: 1 })
    prismaMock.shortLink.update.mockResolvedValue({})

    await Promise.all([flushClickBuffer(), flushClickBuffer()])

    expect(prismaMock.shortLinkClick.createMany).toHaveBeenCalledTimes(1)
    expect(prismaMock.shortLink.update).toHaveBeenCalledTimes(1)
  })

  it('releases lock when job fails mid-run (interrupted execution)', async () => {
    const rawEvent = JSON.stringify({
      shortLinkId: 'link-1',
      referrer: 'google.com',
      ip: '1.1.1.1',
      country: 'US',
      city: 'NY',
      os: 'Mac',
      browser: 'Chrome',
      device: 'Desktop',
      clickedAt: '2026-03-16T12:00:00.000Z',
    })

    redisMock.set.mockResolvedValueOnce('OK')
    redisMock.del.mockResolvedValue(1)
    mockPipeline.exec.mockResolvedValueOnce([[null, [rawEvent]], [null, 1]])

    prismaMock.shortLinkClick.createMany.mockRejectedValueOnce(new Error('db write failed'))

    await expect(flushClickBuffer()).rejects.toThrow('db write failed')
    expect(redisMock.del).toHaveBeenCalledWith('click:buffer:flush:lock')
  })
})
