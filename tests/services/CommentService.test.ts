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

  it('normalizes pagination bounds', async () => {
    ;(prismaMock.comment.findMany as jest.Mock).mockResolvedValue([])
    ;(prismaMock.comment.count as jest.Mock).mockResolvedValue(0)

    await CommentService.getAllComments({ page: -3, pageSize: 0 })

    expect(prismaMock.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 1 }),
    )
  })

  it('caps page size to max boundary', async () => {
    ;(prismaMock.comment.findMany as jest.Mock).mockResolvedValue([])
    ;(prismaMock.comment.count as jest.Mock).mockResolvedValue(0)

    await CommentService.getAllComments({ page: 0, pageSize: 9999 })

    expect(prismaMock.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    )
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
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)
    ;(prismaMock.comment.update as jest.Mock).mockResolvedValue({ ...mockComment, deletedAt: new Date() })

    await CommentService.deleteComment('c-1')

    expect(prismaMock.comment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { commentId: 'c-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    )
  })

  it('denies delete for non-owner and non-admin', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)

    await expect(
      CommentService.deleteComment('c-1', {
        requesterEmail: 'attacker@example.com',
        requesterRole: 'USER',
      }),
    ).rejects.toThrow('Forbidden.')
  })

  it('allows owner delete when auth context is provided', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)
    ;(prismaMock.comment.update as jest.Mock).mockResolvedValue({
      ...mockComment,
      deletedAt: new Date(),
    })

    await CommentService.deleteComment('c-1', {
      requesterEmail: 'user@example.com',
      requesterRole: 'USER',
    })

    expect(prismaMock.comment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { commentId: 'c-1' } }),
    )
  })
})

describe('CommentService.updateComment', () => {
  it('calls prisma.comment.update with commentId and data', async () => {
    const updated = { ...mockComment, content: 'Updated content.' }
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)
    ;(prismaMock.comment.update as jest.Mock).mockResolvedValue(updated)

    const result = await CommentService.updateComment({ commentId: 'c-1', content: 'Updated content.' } as any)

    expect(prismaMock.comment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { commentId: 'c-1' } }),
    )
    expect(result.content).toBe('Updated content.')
  })

  it('denies update for non-owner and non-admin', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)

    await expect(
      CommentService.updateComment(
        { commentId: 'c-1', content: 'Updated content.' } as any,
        { requesterEmail: 'attacker@example.com', requesterRole: 'USER' },
      ),
    ).rejects.toThrow('Forbidden.')
  })

  it('strips immutable fields from update payload', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)
    ;(prismaMock.comment.update as jest.Mock).mockResolvedValue(mockComment)

    await CommentService.updateComment(
      {
        commentId: 'c-1',
        content: 'Updated content.',
        email: 'other@example.com',
        name: 'Other',
        postId: 'post-2',
        parentId: 'p-1',
        createdAt: new Date(),
        deletedAt: new Date(),
      } as any,
      { requesterEmail: 'user@example.com', requesterRole: 'USER' },
    )

    const updateArg = (prismaMock.comment.update as jest.Mock).mock.calls[0][0]
    expect(updateArg.data.email).toBeUndefined()
    expect(updateArg.data.name).toBeUndefined()
    expect(updateArg.data.postId).toBeUndefined()
    expect(updateArg.data.parentId).toBeUndefined()
    expect(updateArg.data.createdAt).toBeUndefined()
    expect(updateArg.data.deletedAt).toBeUndefined()
  })

  it('blocks publishing when current status is spam', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue({
      ...mockComment,
      status: 'SPAM',
    })

    await expect(
      CommentService.updateComment(
        { commentId: 'c-1', status: 'PUBLISHED' } as any,
        { requesterRole: 'ADMIN' },
      ),
    ).rejects.toThrow('Spam comment cannot be published directly.')
  })
})

describe('CommentService.approveComment', () => {
  it('returns already published comment as-is', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue({
      ...mockComment,
      status: 'PUBLISHED',
    })

    const result = await CommentService.approveComment('c-1')
    expect(result.status).toBe('PUBLISHED')
    expect(prismaMock.comment.update).not.toHaveBeenCalled()
  })

  it('throws when trying to approve spam comment', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue({
      ...mockComment,
      status: 'SPAM',
    })

    await expect(CommentService.approveComment('c-1')).rejects.toThrow(
      'Spam comment cannot be published directly.',
    )
  })

  it('publishes pending comment', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)
    ;(prismaMock.comment.update as jest.Mock).mockResolvedValue({
      ...mockComment,
      status: 'PUBLISHED',
    })

    const result = await CommentService.approveComment('c-1')
    expect(result.status).toBe('PUBLISHED')
    expect(prismaMock.comment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { commentId: 'c-1' }, data: { status: 'PUBLISHED' } }),
    )
  })
})

describe('CommentService.markCommentAsSpam', () => {
  it('returns already spam comment as-is', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue({
      ...mockComment,
      status: 'SPAM',
    })

    const result = await CommentService.markCommentAsSpam('c-1')
    expect(result.status).toBe('SPAM')
    expect(prismaMock.comment.update).not.toHaveBeenCalled()
  })

  it('marks non-spam comment as spam', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue(mockComment)
    ;(prismaMock.comment.update as jest.Mock).mockResolvedValue({
      ...mockComment,
      status: 'SPAM',
    })

    const result = await CommentService.markCommentAsSpam('c-1')
    expect(result.status).toBe('SPAM')
    expect(prismaMock.comment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { commentId: 'c-1' }, data: { status: 'SPAM' } }),
    )
  })
})

// ── Phase 23 additions ────────────────────────────────────────────────────────

describe('CommentService.createComment – missing / invalid post guards', () => {
  it('throws when postId is empty (treated as a required field)', async () => {
    await expect(
      CommentService.createComment({ ...validCommentData, postId: '' } as any),
    ).rejects.toThrow('All fields are required.')
  })

  it('does not create a comment when duplicate content already exists for a different post', async () => {
    // Duplicate check is content-only, so the same text on a different post is blocked
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue({
      ...mockComment,
      postId: 'post-999',
    })

    await expect(
      CommentService.createComment({ ...validCommentData, postId: 'post-2' } as any),
    ).rejects.toThrow('Comment with the same content already exists.')
    expect(prismaMock.comment.create).not.toHaveBeenCalled()
  })
})

describe('CommentService.createComment – banned / invalid author', () => {
  it('throws on malformed email (invalid format)', async () => {
    await expect(
      CommentService.createComment({ ...validCommentData, email: 'bad-email' } as any),
    ).rejects.toThrow('Invalid email.')
  })

  it('throws on email that is just whitespace', async () => {
    await expect(
      CommentService.createComment({ ...validCommentData, email: '   ' } as any),
    ).rejects.toThrow('Invalid email.')
  })

  it('throws on missing name field (required)', async () => {
    await expect(
      CommentService.createComment({ ...validCommentData, name: '' } as any),
    ).rejects.toThrow('All fields are required.')
  })
})

describe('CommentService – status transitions', () => {
  it('PENDING → PUBLISHED: approveComment sets status to PUBLISHED', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue({
      ...mockComment,
      status: 'NOT_PUBLISHED',
    })
    ;(prismaMock.comment.update as jest.Mock).mockResolvedValue({
      ...mockComment,
      status: 'PUBLISHED',
    })

    const result = await CommentService.approveComment('c-1')
    expect(result.status).toBe('PUBLISHED')
    expect(prismaMock.comment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'PUBLISHED' } }),
    )
  })

  it('PUBLISHED → SPAM: markCommentAsSpam transitions from PUBLISHED to SPAM', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue({
      ...mockComment,
      status: 'PUBLISHED',
    })
    ;(prismaMock.comment.update as jest.Mock).mockResolvedValue({
      ...mockComment,
      status: 'SPAM',
    })

    const result = await CommentService.markCommentAsSpam('c-1')
    expect(result.status).toBe('SPAM')
    expect(prismaMock.comment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'SPAM' } }),
    )
  })

  it('SPAM → PUBLISHED is blocked via approveComment', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue({
      ...mockComment,
      status: 'SPAM',
    })

    await expect(CommentService.approveComment('c-1')).rejects.toThrow(
      'Spam comment cannot be published directly.',
    )
  })

  it('SPAM → PUBLISHED is blocked via updateComment', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue({
      ...mockComment,
      status: 'SPAM',
    })

    await expect(
      CommentService.updateComment(
        { commentId: 'c-1', status: 'PUBLISHED' } as any,
        { requesterRole: 'ADMIN' },
      ),
    ).rejects.toThrow('Spam comment cannot be published directly.')
  })

  it('approveComment is idempotent when comment is already PUBLISHED', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue({
      ...mockComment,
      status: 'PUBLISHED',
    })

    const result = await CommentService.approveComment('c-1')
    expect(result.status).toBe('PUBLISHED')
    // No DB write — already in the target state
    expect(prismaMock.comment.update).not.toHaveBeenCalled()
  })

  it('markCommentAsSpam is idempotent when comment is already SPAM', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue({
      ...mockComment,
      status: 'SPAM',
    })

    const result = await CommentService.markCommentAsSpam('c-1')
    expect(result.status).toBe('SPAM')
    expect(prismaMock.comment.update).not.toHaveBeenCalled()
  })
})

describe('CommentService – nested comment (parentId)', () => {
  it('creates a reply by setting parentId on the comment', async () => {
    const replyData = {
      ...validCommentData,
      parentId: 'c-1',
    }
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prismaMock.comment.create as jest.Mock).mockResolvedValue({
      ...mockComment,
      parentId: 'c-1',
    })

    const result = await CommentService.createComment(replyData as any)
    expect(result.parentId).toBe('c-1')
    expect(prismaMock.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ parentId: 'c-1' }) }),
    )
  })

  it('creates a top-level comment when parentId is null', async () => {
    ;(prismaMock.comment.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prismaMock.comment.create as jest.Mock).mockResolvedValue(mockComment)

    const result = await CommentService.createComment(validCommentData as any)
    expect(result.parentId).toBeNull()
  })
})
