import  PostService from '@/services/PostService'

describe('PostService', () => {
  it('should be defined', () => {
    expect(PostService).toBeDefined()
  })
})

import { prisma } from '@/libs/prisma'
import redisInstance from '@/libs/redis'

jest.mock('@/libs/prisma', () => ({
  __esModule: true,
  prisma: {
    post: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: {
    del: jest.fn(),
  },
}))

describe('PostService', () => {
  const mockPost = {
    postId: '1',
    title: 'Test Post',
    description: 'Desc',
    slug: 'test-post',
    keywords: ['test'],
    image: '/img.jpg',
    authorId: 'u1',
    categoryId: 'c1',
    createdAt: new Date(),
    status: 'PUBLISHED',
    views: 0,
    content: 'Hello',
    deletedAt: null,
    category: {
      categoryId: 'c1',
      title: 'Cat',
      description: null,
      slug: 'cat',
      createdAt: new Date(),
      image: '',
      keywords: ['test'],
      updatedAt: undefined,
    },
    author: { userId: 'u1', name: 'Kuray', profilePicture: '' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // CREATE
  it('creates a post successfully', async () => {
    ;(prisma.post.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.post.create as jest.Mock).mockResolvedValue(mockPost)

    const data = {
      title: 'Test Post',
      description: 'Desc',
      slug: 'test-post',
      keywords: 'test',
      image: '/img.jpg',
      authorId: 'u1',
      categoryId: 'c1',
      content: 'Hello',
      status: 'PUBLISHED',
    }

    const result = await PostService.createPost(data as any)

    expect(prisma.post.findFirst).toHaveBeenCalled()
    expect(prisma.post.create).toHaveBeenCalled()
    expect(redisInstance.del).toHaveBeenCalledWith('sitemap:blog')
    expect(result.title).toBe('Test Post')
  })

  it('throws error if missing fields in create', async () => {
    await expect(PostService.createPost({ title: '' } as any)).rejects.toThrow(
      'All fields are required.'
    )
  })

  // GET ALL
  it('retrieves all posts and total count', async () => {
    ;(prisma.$transaction as jest.Mock).mockResolvedValue([[mockPost], 1])

    const result = await PostService.getAllPosts({ page: 1, pageSize: 10 })
    expect(result.posts).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('throws error for SQL injection search', async () => {
    await expect(
      PostService.getAllPosts({ page: 1, pageSize: 10, search: 'DROP TABLE posts' })
    ).rejects.toThrow('Invalid search query.')
  })

  // UPDATE
  it('updates post successfully', async () => {
    ;(prisma.post.update as jest.Mock).mockResolvedValue(mockPost)

    const result = await PostService.updatePost(mockPost as any)

    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { postId: mockPost.postId },
      data: mockPost,
    })
    expect(redisInstance.del).toHaveBeenCalledWith('sitemap:blog')
    expect(result.postId).toBe('1')
  })

  it('throws error if missing fields in update', async () => {
    await expect(PostService.updatePost({ postId: '1' } as any)).rejects.toThrow(
      'All fields are required.'
    )
  })

  // DELETE
  it('archives post instead of deleting', async () => {
    ;(prisma.post.update as jest.Mock).mockResolvedValue(mockPost)
    await PostService.deletePost('1')
    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { postId: '1' },
      data: expect.objectContaining({ status: 'ARCHIVED' }),
    })
  })

  // INCREMENT VIEW
  it('increments view count', async () => {
    ;(prisma.post.update as jest.Mock).mockResolvedValue({ ...mockPost, views: 1 })
    const res = await PostService.incrementViewCount('1')
    expect(res.views).toBe(1)
  })

  // GET BY ID
  it('retrieves a post by id', async () => {
    ;(prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost)
    const res = await PostService.getPostById('1')
    expect(res?.title).toBe('Test Post')
  })

  // GET ALL SLUGS
  it('returns all post slugs', async () => {
    ;(prisma.post.findMany as jest.Mock).mockResolvedValue([
      { title: 'T', slug: 't', category: { slug: 'c' } },
    ])
    const res = await PostService.getAllPostSlugs()
    expect(res[0]).toEqual({ title: 'T', slug: 't', categorySlug: 'c' })
  })

  // SITEMAP
  it('generates sitemap entries', async () => {
    jest.spyOn(PostService, 'getAllPosts').mockResolvedValue({
      posts: [mockPost],
      total: 1,
    })
    const sitemap = await PostService.generateSiteMap()
    expect(sitemap[0].url).toBe('/blog/test-post')
  })
})
