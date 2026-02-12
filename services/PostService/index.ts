import { Post, PostSchema, PostWithData } from '@/types/content/BlogTypes'
import { prisma } from '@/libs/prisma'
import { MetadataRoute } from 'next'
import redisInstance from '@/libs/redis'

export default class PostService {
  private static CACHE_KEY = 'sitemap:blog'
  private static sqlInjectionRegex =
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)|(--)|(\b(AND|OR|NOT|IS|NULL|LIKE|IN|BETWEEN|EXISTS|CASE|WHEN|THEN|END|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|HAVING|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET)\b)/i // SQL injection prevention

  private static postWithDataSelect = {
    postId: true,
    title: true,
    description: true,
    slug: true,
    keywords: true,
    image: true,
    authorId: true,
    categoryId: true,
    createdAt: true,
    updatedAt: true,
    status: true,
    views: true,
    content: true, // Include content only if postId or slug is provided
    deletedAt: true,
    category: {
      select: {
        categoryId: true,
        title: true,
        slug: true,
        image: true,
      },
    },
    author: {
      select: {
        userId: true,
        userProfile: true,
      },
    },
  }

  /**
   * Creates a new post with regex validation.
   * @param data - Post data
   * @returns The created post
   */
  static async createPost(data: Omit<Post, 'postId'>): Promise<Post> {
    let { title, content, description, slug, keywords, authorId, categoryId } = data

    // Validate input
    if (!title || !content || !description || !slug || !keywords || !authorId || !categoryId) {
      throw new Error('All fields are required.')
    }

    if (keywords && typeof keywords === 'string') {
      keywords = (keywords as string).split(',')
    }

    // Validate input
    const existingPost = await prisma.post.findFirst({
      where: { OR: [{ title }, { slug }] },
    })

    if (existingPost) {
      throw new Error('Post with the same title or slug already exists.')
    }

    await redisInstance.del(this.CACHE_KEY)

    const createdPost = await prisma.post.create({ data })
    return PostSchema.parse(createdPost)
  }

  /**
   * Retrieves all posts with optional pagination and search.
   * @param page - The page number
   * @param perPage - The number of posts per page
   * @param search - The search query
   * @returns An array of posts
   */
  static async getAllPosts(data: {
    page: number
    pageSize: number
    search?: string
    categoryId?: string
    authorId?: string
    status?: string //ALL, PUBLISHED, DRAFT
    postId?: string
    slug?: string
    createdAfter?: Date
  }): Promise<{ posts: PostWithData[]; total: number }> {
    const { page, pageSize, search, categoryId, status, authorId, postId, slug } = data
    // Validate search query
    if (search && this.sqlInjectionRegex.test(search)) {
      throw new Error('Invalid search query.')
    }

    //ALL, PUBLISHED, DRAFT

    const now = new Date()
    // Get posts by search query
    const query = {
      skip: page * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: 'desc',
      },
      select: this.postWithDataSelect,
      where: {
        OR: [
          {
            title: {
              contains: search || '',
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search || '',
              mode: 'insensitive',
            },
          },
        ],
        authorId: authorId ? authorId : undefined,
        postId: postId ? postId : undefined,
        categoryId: categoryId ? categoryId : undefined,
        status: status ? (status === 'ALL' ? undefined : status) : 'PUBLISHED',
        createdAt: {
          lte: status === 'ALL' ? undefined : now,
          gte: data.createdAfter ? data.createdAfter : undefined,
        },
        deletedAt: {
          equals: status === 'ALL' ? undefined : null,
        },
        slug: slug ? slug : undefined,
      },
    }

    const countQuery = {
      //skip: query.skip,
      //take: query.take,
      where: query.where,
    }

    const transaction = await prisma.$transaction([
      prisma.post.findMany(query as any),
      prisma.post.count(countQuery as any),
    ])

    return { posts: transaction[0] as PostWithData[], total: transaction[1] }
  }

  /**
   * Updates a post by its ID.
   * @param postId - The ID of the post
   * @param data - The updated post data
   * @returns The updated post
   */
  static async updatePost(data: Post): Promise<Post> {
    const { postId, title, content, description, slug, keywords, authorId, categoryId } = data

    console.log('Updating post:', postId)

    // Validate input
    if (!title || !content || !description || !slug || !keywords || !authorId || !categoryId) {
      throw new Error('All fields are required.')
    }

    if (keywords && typeof keywords === 'string') {
      data.keywords = (keywords as string).split(',')
    }

    console.log('Validated data for post:', postId)

    // Update the post
    const post = await prisma.post.update({
      where: { postId },
      data,
    })

    await redisInstance.del(this.CACHE_KEY)

    return PostSchema.parse(post)
  }

  /**
   * Deletes a post by its ID.
   * @param postId - The ID of the post
   */
  static async deletePost(postId: string): Promise<void> {
    await redisInstance.del(this.CACHE_KEY)

    await prisma.post.update({
      where: { postId },
      data: {
        status: 'ARCHIVED',
        deletedAt: new Date(),
      },
    })
  }

  /**
   * Save one view to the post
   * @param postId - The ID of the post
   * @returns The updated post
   * */
  static async incrementViewCount(postId: string): Promise<Post> {
    const post = await prisma.post.update({
      where: { postId },
      data: {
        views: {
          increment: 1,
        },
      },
    })

    return PostSchema.parse(post)
  }

  //generate site map how do i do use:
  static async generateSiteMap(): Promise<MetadataRoute.Sitemap> {
    const { posts } = await this.getAllPosts({
      page: 1,
      pageSize: 1000,
      search: '',
      categoryId: '',
      status: 'PUBLISHED',
    })
    return posts.map((post) => {
      return {
        url: `/blog/${post.slug}`,
        lastModified: post.createdAt.toISOString(),
        changeFrequency: 'daily',
        priority: 0.7,
      }
    })
  }

  /**
   * Retrieves a post by its ID.
   * @param postId - The ID of the post
   * @returns The post
   */
  static async getPostById(postId: string): Promise<PostWithData | null> {
    return (await prisma.post.findUnique({
      where: { postId },
      select: this.postWithDataSelect,
    })) as PostWithData | null
  }

  /**
   * Get all blogpost slugs with postName and categorySlug
   * @returns Array of objects with postName and categorySlug
   * */
  static async getAllPostSlugs(): Promise<
    {
      title: string
      slug: string
      categorySlug: string
      categoryTitle: string
      description: string | null
      content: string
      authorName: string
      createdAt: Date
      updatedAt: Date | null
    }[]
  > {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        createdAt: {
          lte: new Date(),
        },
      },
      select: {
        title: true,
        slug: true,
        description: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            slug: true,
            title: true,
          },
        },
        author: {
          select: {
            userProfile: true,
          },
        },
      },
    })

    return posts.map((post) => ({
      title: post.title,
      slug: post.slug,
      categorySlug: post.category?.slug || '',
      categoryTitle: post.category?.title || '',
      description: post.description,
      content: post.content,
      authorName: (post.author?.userProfile as { name?: string } | null)?.name || 'Kuray Karaaslan',
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }))
  }
}
