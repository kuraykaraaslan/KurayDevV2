import { Comment, CommentWithData } from '@/types/content/BlogTypes'
import { prisma } from '@/libs/prisma'

export default class CommentService {
  private static readonly MAX_PAGE_SIZE = 100

  private static sqlInjectionRegex =
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)|(--)|(\b(AND|OR|NOT|IS|NULL|LIKE|IN|BETWEEN|EXISTS|CASE|WHEN|THEN|END|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|HAVING|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET)\b)/i // SQL injection prevention
  private static emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  private static commentRegex = /^[\p{L}\p{N}\p{M}\s.,!?:;'"()\-_/]+$/u
  private static noHTMLRegex = /<[^>]*>?/gm
  private static noJS = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi

  private static normalizePagination(page: number, pageSize: number) {
    const safePage = Number.isFinite(page) ? Math.max(0, Math.floor(page)) : 0
    const safePageSizeRaw = Number.isFinite(pageSize) ? Math.floor(pageSize) : 10
    const safePageSize = Math.min(this.MAX_PAGE_SIZE, Math.max(1, safePageSizeRaw))
    return { safePage, safePageSize }
  }

  /**
   * Creates a new comment with regex validation.
   * @param data - Comment data
   * @returns The created comment
   */

  static async createComment(data: Omit<Comment, 'commentId'>): Promise<Comment> {
    let { content, postId, email, name } = data

    // Validate input
    if (!content || !postId || !email || !name) {
      throw new Error('All fields are required.')
    }

    // Check for SQL injection
    if (this.sqlInjectionRegex.test(content)) {
      throw new Error('SQL injection detected.')
    }

    // Validate email

    if (!this.emailRegex.test(email)) {
      throw new Error('Invalid email.')
    }

    // Validate comment content
    if (!this.commentRegex.test(content)) {
      throw new Error('Invalid comment content.')
    }

    // Sanitize input
    content = content.replace(this.noHTMLRegex, '')
    content = content.replace(this.noJS, '')

    // Validate input
    const existingComment = await prisma.comment.findFirst({
      where: { content, deletedAt: null },
    })

    if (existingComment) {
      throw new Error('Comment with the same content already exists.')
    }

    return await prisma.comment.create({ data })
  }

  /**
   * Retrieves all comments with optional pagination and search.
   * @param page - The page number
   * @param perPage - The number of comments per page
   * @param search - The search query
   * @param postId - The post ID
   * @returns An array of comments
   */
  static async getAllComments(data: {
    page: number
    pageSize: number
    search?: string
    postId?: string
    pending?: boolean
    sortKey?: string
    sortDir?: 'asc' | 'desc'
  }): Promise<{ comments: CommentWithData[]; total: number }> {
    const { page, pageSize, search, postId, pending, sortKey, sortDir } = data
    const { safePage, safePageSize } = this.normalizePagination(page, pageSize)

    // Validate search query
    if (search && this.sqlInjectionRegex.test(search)) {
      throw new Error('SQL injection detected.')
    }

    const ALLOWED_SORT_KEYS: Record<string, string> = { content: 'content', name: 'name', email: 'email', status: 'status', createdAt: 'createdAt' }
    const resolvedSortKey = (sortKey && ALLOWED_SORT_KEYS[sortKey]) ?? 'createdAt'
    const resolvedSortDir: 'asc' | 'desc' = sortDir === 'asc' ? 'asc' : 'desc'

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        content: { contains: search },
        status: pending ? undefined : 'PUBLISHED',
        deletedAt: null,
      },
      orderBy: { [resolvedSortKey]: resolvedSortDir },
      skip: safePage * safePageSize,
      take: safePageSize,
      select: {
        commentId: true,
        content: true,
        email: true,
        name: true,
        postId: true,
        parentId: true,
        status: true,
        createdAt: true,
        post: {
          select: {
            title: true,
            slug: true,
            postId: true,
            image: true,
          },
        },
      },
    })

    const total = await prisma.comment.count({
      where: {
        postId,
        content: {
          contains: search,
        },
        deletedAt: null,
      },
    })

    return { comments, total }
  }

  /**
   * Retrieves a comment by ID.
   * @param commentId - The comment ID
   * @returns The comment
   */
  static async getCommentById(commentId: string): Promise<Comment> {
    const comment = await prisma.comment.findFirst({
      where: { commentId, deletedAt: null },
    })

    if (!comment) {
      throw new Error('Comment not found.')
    }

    return comment
  }

  /**
   * Deletes a comment by ID.
   * @param commentId - The comment ID
   * @returns The deleted comment
   */
  static async deleteComment(
    commentId: string,
    auth?: { requesterEmail?: string; requesterRole?: string }
  ): Promise<Comment> {
    const existing = await prisma.comment.findFirst({ where: { commentId, deletedAt: null } })
    if (!existing) {
      throw new Error('Comment not found.')
    }

    if (auth) {
      const isAdmin = auth.requesterRole === 'ADMIN'
      const isOwner = !!auth.requesterEmail && auth.requesterEmail === existing.email
      if (!isAdmin && !isOwner) {
        throw new Error('Forbidden.')
      }
    }

    const comment = await prisma.comment.update({
      where: { commentId },
      data: { deletedAt: new Date() },
    })

    if (!comment) {
      throw new Error('Comment not found.')
    }

    return comment
  }

  /**
   * Updates a comment by ID.
   * @param commentId - The comment ID
   * @param data - The comment data
   * @returns The updated comment
   */
  static async updateComment(
    data: { commentId: string } & Partial<Comment>,
    auth?: { requesterEmail?: string; requesterRole?: string }
  ): Promise<Comment> {
    const { commentId } = data

    const existing = await prisma.comment.findFirst({ where: { commentId, deletedAt: null } })
    if (!existing) {
      throw new Error('Comment not found.')
    }

    if (auth) {
      const isAdmin = auth.requesterRole === 'ADMIN'
      const isOwner = !!auth.requesterEmail && auth.requesterEmail === existing.email
      if (!isAdmin && !isOwner) {
        throw new Error('Forbidden.')
      }
    }

    if (existing.status === 'SPAM' && data.status === 'PUBLISHED') {
      throw new Error('Spam comment cannot be published directly.')
    }

    const updateData: any = { ...data }
    delete updateData.commentId
    delete updateData.email
    delete updateData.name
    delete updateData.postId
    delete updateData.parentId
    delete updateData.createdAt
    delete updateData.deletedAt

    // Update the comment
    const comment = await prisma.comment.update({
      where: { commentId },
      data: updateData,
    })

    return comment
  }

  static async approveComment(commentId: string): Promise<Comment> {
    const comment = await prisma.comment.findFirst({ where: { commentId, deletedAt: null } })

    if (!comment) {
      throw new Error('Comment not found.')
    }

    if (comment.status === 'PUBLISHED') {
      return comment
    }

    if (comment.status === 'SPAM') {
      throw new Error('Spam comment cannot be published directly.')
    }

    return prisma.comment.update({
      where: { commentId },
      data: { status: 'PUBLISHED' },
    })
  }

  static async markCommentAsSpam(commentId: string): Promise<Comment> {
    const comment = await prisma.comment.findFirst({ where: { commentId, deletedAt: null } })

    if (!comment) {
      throw new Error('Comment not found.')
    }

    if (comment.status === 'SPAM') {
      return comment
    }

    return prisma.comment.update({
      where: { commentId },
      data: { status: 'SPAM' },
    })
  }
}
