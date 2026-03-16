import CommentService from '@/services/CommentService'
import { prisma } from '@/libs/prisma'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    comment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const prismaMock = prisma as any

const mockComment = {
  commentId: 'c-1',
  content: 'Hello World, how are you?',
  postId: 'post-1',
  email: 'user@example.com',
  name: 'John Doe',
  parentId: null,
  status: 'NOT_PUBLISHED',
  createdAt: new Date(),
  deletedAt: null,
}

const validCommentData = {
  content: 'Hello World, how are you?',
  postId: 'post-1',
  email: 'user@example.com',
  name: 'John Doe',
  parentId: null as null,
  status: 'NOT_PUBLISHED' as const,
}

beforeEach(() => jest.resetAllMocks())

describe('CommentService.createComment', () => {
  it('throws when required fields are missing', async () => {
    await expect(
      CommentService.createComment({ ...validCommentData, content: '' } as any),
    ).rejects.toThrow('All fields are required.')
  })

  it('throws on SQL injection in content', async () => {
    await expect(
      CommentService.createComment({ ...validCommentData, content: 'SELECT * FROM users' } as any),
    ).rejects.toThrow('SQL injection detected.')
  })

  it('throws on invalid email', async () => {
    await expect(
      CommentService.createComment({ ...validCommentData, email: 'not-an-email' } as any),
    ).rejects.toThrow('Invalid email.')
  })

  it('throws on HTML content (invalid comment regex)', async () => {
    await expect(
      CommentService.createComment({
        ...validCommentData,
        content: 'Hello <script>alert(1)</script>',
      } as any),
    ).rejects.toThrow('Invalid comment content.')
  })

  it('throws when duplicate content exists', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)
    await expect(CommentService.createComment(validCommentData as any)).rejects.toThrow(
      'Comment with the same content already exists.',
    )
  })

  it('creates comment when valid data is provided', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prismaMock.comment.create as jest.Mock).mockResolvedValue(mockComment)

    const result = await CommentService.createComment(validCommentData as any)

    expect(prismaMock.comment.create).toHaveBeenCalled()
    expect(result).toEqual(mockComment)
  })
})

describe('CommentService.getAllComments', () => {
  it('throws on SQL injection in search', async () => {
    await expect(
      CommentService.getAllComments({ page: 0, pageSize: 10, search: 'SELECT * FROM users' }),
    ).rejects.toThrow('SQL injection detected.')
  })

  it('filters by status PUBLISHED when pending is false', async () => {
    ;(prismaMock.comment.findMany as jest.Mock).mockResolvedValue([])
    ;(prismaMock.comment.count as jest.Mock).mockResolvedValue(0)

    await CommentService.getAllComments({ page: 0, pageSize: 10, pending: false })

    expect(prismaMock.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PUBLISHED' }),
      }),
    )
  })

  it('returns comments and total', async () => {
    ;(prismaMock.comment.findMany as jest.Mock).mockResolvedValue([mockComment])
    ;(prismaMock.comment.count as jest.Mock).mockResolvedValue(1)

    const result = await CommentService.getAllComments({ page: 0, pageSize: 10 })
    expect(result).toEqual({ comments: [mockComment], total: 1 })
  })
})

describe('CommentService.getCommentById', () => {
  it('throws when comment is not found', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue(null)
    await expect(CommentService.getCommentById('nonexistent')).rejects.toThrow('Comment not found.')
  })

  it('returns comment when found', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)
    const result = await CommentService.getCommentById('c-1')
    expect(result).toEqual(mockComment)
  })
})

describe('CommentService.deleteComment', () => {
  it('soft deletes by setting deletedAt via update', async () => {
    ;(prismaMock.comment.update as jest.Mock).mockResolvedValue({ ...mockComment, deletedAt: new Date() })

    await CommentService.deleteComment('c-1')

    expect(prismaMock.comment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { commentId: 'c-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    )
  })
})

describe('CommentService.updateComment', () => {
  it('calls prisma.comment.update with commentId and data', async () => {
    const updated = { ...mockComment, content: 'Updated content.' }
    ;(prismaMock.comment.update as jest.Mock).mockResolvedValue(updated)

    const result = await CommentService.updateComment({ commentId: 'c-1', content: 'Updated content.' } as any)

    expect(prismaMock.comment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { commentId: 'c-1' } }),
    )
    expect(result.content).toBe('Updated content.')
  })
})
