import PostLikeService from '@/services/PostService/LikeService'
import { prisma } from '@/libs/prisma'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    like: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}))

jest.mock('@/services/UserAgentService', () => ({
  __esModule: true,
  default: {
    parseRequest: jest.fn().mockResolvedValue({ ip: '1.2.3.4', deviceFingerprint: 'fp-abc' }),
  },
}))

import UserAgentService from '@/services/UserAgentService'

const prismaMock = prisma as any
const mockReq = { user: null } as unknown as NextRequest

const mockLike = {
  likeId: 'like-1',
  postId: 'post-1',
  userId: null,
  ipAddress: '1.2.3.4',
  deviceFingerprint: 'fp-abc',
  createdAt: new Date(),
}

beforeEach(() => jest.resetAllMocks())

describe('PostLikeService.likePost', () => {
  it('throws when no userId and no ip/fingerprint', async () => {
    ;(UserAgentService.parseRequest as jest.Mock).mockResolvedValue({ ip: null, deviceFingerprint: null })

    await expect(
      PostLikeService.likePost({ postId: 'post-1', request: mockReq }),
    ).rejects.toThrow('Insufficient data to create a like.')
  })

  it('returns existing like when post is already liked', async () => {
    ;(UserAgentService.parseRequest as jest.Mock).mockResolvedValue({ ip: '1.2.3.4', deviceFingerprint: 'fp-abc' })
    ;(prismaMock.like.findFirst as jest.Mock).mockResolvedValue(mockLike)

    const result = await PostLikeService.likePost({ postId: 'post-1', request: mockReq })

    expect(result).toEqual(mockLike)
    expect(prismaMock.like.create).not.toHaveBeenCalled()
  })

  it('creates like when no existing like', async () => {
    ;(UserAgentService.parseRequest as jest.Mock).mockResolvedValue({ ip: '1.2.3.4', deviceFingerprint: 'fp-abc' })
    ;(prismaMock.like.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prismaMock.like.create as jest.Mock).mockResolvedValue(mockLike)

    const result = await PostLikeService.likePost({ postId: 'post-1', request: mockReq })

    expect(prismaMock.like.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ postId: 'post-1', ipAddress: '1.2.3.4', deviceFingerprint: 'fp-abc' }),
      }),
    )
    expect(result).toEqual(mockLike)
  })

  it('is idempotent for two sequential like attempts', async () => {
    ;(UserAgentService.parseRequest as jest.Mock).mockResolvedValue({ ip: '1.2.3.4', deviceFingerprint: 'fp-abc' })
    ;(prismaMock.like.findFirst as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockLike)
    ;(prismaMock.like.create as jest.Mock).mockResolvedValueOnce(mockLike)

    const first = await PostLikeService.likePost({ postId: 'post-1', request: mockReq })
    const second = await PostLikeService.likePost({ postId: 'post-1', request: mockReq })

    expect(first).toEqual(mockLike)
    expect(second).toEqual(mockLike)
    expect(prismaMock.like.create).toHaveBeenCalledTimes(1)
  })
})

describe('PostLikeService.unlikePost', () => {
  it('throws when no userId and no ip/fingerprint', async () => {
    ;(UserAgentService.parseRequest as jest.Mock).mockResolvedValue({ ip: null, deviceFingerprint: null })

    await expect(
      PostLikeService.unlikePost({ postId: 'post-1', request: mockReq }),
    ).rejects.toThrow('Insufficient data to remove like.')
  })

  it('returns without throwing when like is not found', async () => {
    ;(UserAgentService.parseRequest as jest.Mock).mockResolvedValue({ ip: '1.2.3.4', deviceFingerprint: 'fp-abc' })
    ;(prismaMock.like.findFirst as jest.Mock).mockResolvedValue(null)

    await expect(
      PostLikeService.unlikePost({ postId: 'post-1', request: mockReq }),
    ).resolves.toBeUndefined()

    expect(prismaMock.like.delete).not.toHaveBeenCalled()
  })

  it('deletes like on success', async () => {
    ;(UserAgentService.parseRequest as jest.Mock).mockResolvedValue({ ip: '1.2.3.4', deviceFingerprint: 'fp-abc' })
    ;(prismaMock.like.findFirst as jest.Mock).mockResolvedValue(mockLike)
    ;(prismaMock.like.delete as jest.Mock).mockResolvedValue(mockLike)

    await PostLikeService.unlikePost({ postId: 'post-1', request: mockReq })

    expect(prismaMock.like.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { likeId: 'like-1' } }),
    )
  })
})

describe('PostLikeService.isPostLiked', () => {
  it('returns true when like exists', async () => {
    ;(UserAgentService.parseRequest as jest.Mock).mockResolvedValue({ ip: '1.2.3.4', deviceFingerprint: 'fp-abc' })
    ;(prismaMock.like.findFirst as jest.Mock).mockResolvedValue(mockLike)

    const result = await PostLikeService.isPostLiked({ postId: 'post-1', request: mockReq })
    expect(result).toBe(true)
  })

  it('returns false when like does not exist', async () => {
    ;(UserAgentService.parseRequest as jest.Mock).mockResolvedValue({ ip: '1.2.3.4', deviceFingerprint: 'fp-abc' })
    ;(prismaMock.like.findFirst as jest.Mock).mockResolvedValue(null)

    const result = await PostLikeService.isPostLiked({ postId: 'post-1', request: mockReq })
    expect(result).toBe(false)
  })
})

describe('PostLikeService.countLikes', () => {
  it('returns the like count for a post', async () => {
    ;(prismaMock.like.count as jest.Mock).mockResolvedValue(7)

    const result = await PostLikeService.countLikes('post-1')

    expect(prismaMock.like.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { postId: 'post-1' } }),
    )
    expect(result).toBe(7)
  })
})
