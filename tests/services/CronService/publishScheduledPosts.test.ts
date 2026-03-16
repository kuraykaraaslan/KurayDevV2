import { publishScheduledPosts } from '@/services/CronService/jobs/publishScheduledPosts'
import { prisma } from '@/libs/prisma'
import redis from '@/libs/redis'
import ActivityPubService from '@/services/ActivityPubService'
import Logger from '@/libs/logger'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    post: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

jest.mock('@/libs/redis', () => ({
  set: jest.fn(),
  del: jest.fn(),
}))

jest.mock('@/services/ActivityPubService', () => ({
  __esModule: true,
  default: {
    notifyFollowersOfPost: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

const prismaMock = prisma as any
const redisMock = redis as any
const activityPubMock = ActivityPubService as jest.Mocked<typeof ActivityPubService>
const loggerMock = Logger as jest.Mocked<typeof Logger>

const makeDuePost = (postId: string) => ({
  postId,
  title: `Post ${postId}`,
  content: 'content',
  description: 'desc',
  slug: `post-${postId}`,
  keywords: ['k'],
  publishedAt: new Date('2026-03-16T12:00:00.000Z'),
  category: { slug: 'tech' },
})

describe('publishScheduledPosts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('skips run when reentrancy lock is already held', async () => {
    redisMock.set.mockResolvedValueOnce(null)

    await publishScheduledPosts()

    expect(prismaMock.post.findMany).not.toHaveBeenCalled()
    expect(prismaMock.post.updateMany).not.toHaveBeenCalled()
    expect(activityPubMock.notifyFollowersOfPost).not.toHaveBeenCalled()
    expect(loggerMock.info).toHaveBeenCalledWith(
      'publishScheduledPosts: skipped (already running)'
    )
  })

  it('publishes due posts, invalidates cache, and notifies followers', async () => {
    const due = [makeDuePost('p1'), makeDuePost('p2')]

    redisMock.set.mockResolvedValueOnce('OK')
    redisMock.del.mockResolvedValue(1)
    prismaMock.post.findMany.mockResolvedValueOnce(due)
    prismaMock.post.updateMany.mockResolvedValueOnce({ count: 2 })

    await publishScheduledPosts()

    expect(prismaMock.post.updateMany).toHaveBeenCalledWith({
      where: { postId: { in: ['p1', 'p2'] } },
      data: { status: 'PUBLISHED' },
    })
    expect(redisMock.del).toHaveBeenCalledWith('sitemap:blog')
    expect(redisMock.del).toHaveBeenCalledWith('cron:publishScheduledPosts:lock')
    expect(activityPubMock.notifyFollowersOfPost).toHaveBeenCalledTimes(2)
    expect(loggerMock.info).toHaveBeenCalledWith('publishScheduledPosts: publishing 2 post(s)')
  })

  it('is idempotent across repeated triggers after first publish', async () => {
    redisMock.set.mockResolvedValueOnce('OK').mockResolvedValueOnce('OK')
    redisMock.del.mockResolvedValue(1)
    prismaMock.post.findMany
      .mockResolvedValueOnce([makeDuePost('p1')])
      .mockResolvedValueOnce([])
    prismaMock.post.updateMany.mockResolvedValueOnce({ count: 1 })

    await publishScheduledPosts()
    await publishScheduledPosts()

    expect(prismaMock.post.updateMany).toHaveBeenCalledTimes(1)
    expect(activityPubMock.notifyFollowersOfPost).toHaveBeenCalledTimes(1)
    expect(loggerMock.info).toHaveBeenCalledWith('publishScheduledPosts: no posts due')
  })

  it('releases lock when job fails mid-run', async () => {
    redisMock.set.mockResolvedValueOnce('OK')
    redisMock.del.mockResolvedValue(1)
    prismaMock.post.findMany.mockRejectedValueOnce(new Error('db unavailable'))

    await expect(publishScheduledPosts()).rejects.toThrow('db unavailable')
    expect(redisMock.del).toHaveBeenCalledWith('cron:publishScheduledPosts:lock')
  })
})
