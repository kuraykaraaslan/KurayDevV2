import { prisma } from '@/libs/prisma'
import redisInstance from '@/libs/redis'
import { Project, ProjectWithTranslations } from '@/types/content/ProjectTypes'
import { MetadataRoute } from 'next'

export default class ProjectService {
  private static CACHE_KEY = 'sitemap:project'
  private static readonly MAX_PAGE_SIZE = 100

  private static normalizeSlug(slug: string): string {
    return slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-')
  }

  private static normalizePagination(page: number, pageSize: number) {
    const safePage = Number.isFinite(page) ? Math.max(0, Math.floor(page)) : 0
    const safePageSizeRaw = Number.isFinite(pageSize) ? Math.floor(pageSize) : 10
    const safePageSize = Math.min(this.MAX_PAGE_SIZE, Math.max(1, safePageSizeRaw))
    return { safePage, safePageSize }
  }

  private static sqlInjectionRegex =
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)|(--)|(\b(AND|OR|NOT|IS|NULL|LIKE|IN|BETWEEN|EXISTS|CASE|WHEN|THEN|END|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|HAVING|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET)\b)/i // SQL injection prevention

  static async getAllProjects(data: {
    page: number
    pageSize: number
    projectId?: string
    projectSlug?: string
    search?: string
    onlyPublished?: boolean
    sortKey?: string
    sortDir?: 'asc' | 'desc'
  }): Promise<{ projects: ProjectWithTranslations[]; total: number }> {
    const { page, pageSize, search, onlyPublished, projectId, projectSlug, sortKey, sortDir } = data
    const { safePage, safePageSize } = this.normalizePagination(page, pageSize)

    // Validate search query
    if (search && this.sqlInjectionRegex.test(search)) {
      throw new Error('Invalid search query.')
    }

    const ALLOWED_SORT_KEYS: Record<string, string> = { title: 'title', slug: 'slug', status: 'status', createdAt: 'createdAt', updatedAt: 'updatedAt' }
    const resolvedSortKey = (sortKey && ALLOWED_SORT_KEYS[sortKey]) ?? 'createdAt'
    const resolvedSortDir: 'asc' | 'desc' = sortDir === 'asc' ? 'asc' : 'desc'

    // Get posts by search query
    const query = {
      skip: safePage * safePageSize,
      take: safePageSize,
      select: {
        projectId: true,
        title: true,
        description: true,
        slug: true,
        image: true,
        status: true,
        platforms: true,
        technologies: true,
        projectLinks: true,
        createdAt: true,
        updatedAt: true,
        content: projectSlug || projectId ? true : false,
        translations: {
          select: { id: true, projectId: true, lang: true, title: true, description: true, slug: true, content: true },
        },
      },
      where: {
        OR: [
          {
            title: {
              contains: search || '',
            },
          },
          {
            description: {
              contains: search || '',
            },
          },
          {
            technologies: {
              hasSome: search ? [search] : [],
            },
          },
          {
            platforms: {
              hasSome: search ? [search] : [],
            },
          },
          {
            content: {
              contains: search || '',
            },
          },
        ],
        status: !onlyPublished ? undefined : 'PUBLISHED',
        projectId: projectId ? projectId : undefined,
        slug: projectSlug ? projectSlug : undefined,
        deletedAt: null,
      },
      orderBy: {
        [resolvedSortKey]: resolvedSortDir,
      },
    }

    const countQuery = {
      skip: query.skip,
      take: query.take,
      where: query.where,
    }

    const transaction = await prisma.$transaction([
      prisma.project.findMany(query),
      prisma.project.count(countQuery),
    ])

    return { projects: transaction[0] as ProjectWithTranslations[], total: transaction[1] }
  }

  static async getProjectById(projectId: string): Promise<Project | null> {
    return prisma.project.findFirst({
      where: {
        projectId,
        deletedAt: null,
      },
    })
  }

  static async createProject(data: Omit<Project, 'projectId'>): Promise<Project> {
    // Validate Fields
    const { title, description, slug, image, platforms, technologies, projectLinks } = data

    if (!title || !description || !slug || !image || !platforms || !technologies || !projectLinks) {
      throw new Error('Missing required fields.')
    }

    ;(data as any).slug = this.normalizeSlug(slug)

    await redisInstance.del(this.CACHE_KEY)

    return prisma.project.create({
      data,
    })
  }

  static async updateProject(
    data: Project,
    auth?: { requesterRole?: string }
  ): Promise<Project> {
    // Validate Fields
    const { title, description, slug, image, platforms, technologies, projectLinks } = data

    if (!title || !description || !slug || !image || !platforms || !technologies || !projectLinks) {
      throw new Error('Missing required fields.')
    }

    if (auth && auth.requesterRole !== 'ADMIN') {
      throw new Error('Forbidden.')
    }

    const updateData: any = {
      ...data,
      slug: this.normalizeSlug(slug),
    }

    delete updateData.projectId
    delete updateData.createdAt
    delete updateData.updatedAt
    delete updateData.deletedAt
    delete updateData.translations

    await redisInstance.del(this.CACHE_KEY)

    return prisma.project.update({
      where: {
        projectId: data.projectId,
      },
      data: updateData,
    })
  }

  static async deleteProject(
    projectId: string,
    auth?: { requesterRole?: string }
  ): Promise<Project> {
    if (auth && auth.requesterRole !== 'ADMIN') {
      throw new Error('Forbidden.')
    }

    await redisInstance.del(this.CACHE_KEY)

    return prisma.project.update({
      where: {
        projectId,
      },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  static async generateSiteMap(): Promise<MetadataRoute.Sitemap> {
    const projects = await prisma.project.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      where: { deletedAt: null },
    })

    return projects.map((project) => {
      return {
        url: `/project/${project.slug}`,
        lastModified: project.updatedAt ? new Date(project.updatedAt) : new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
      }
    })
  }

  static async getAllProjectSlugs(): Promise<{ title: string; slug: string }[]> {
    const projects = await prisma.project.findMany({
      select: {
        title: true,
        slug: true,
      },
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
    })

    return projects
  }
}
