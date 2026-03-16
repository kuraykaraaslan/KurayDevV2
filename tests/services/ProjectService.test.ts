import ProjectService from '@/services/ProjectService'
import { prisma } from '@/libs/prisma'
import redis from '@/libs/redis'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    project: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const prismaMock = prisma as any
const redisMock = redis as jest.Mocked<typeof redis>

const mockProject = {
  projectId: 'proj-1',
  title: 'My Project',
  description: 'A test project',
  slug: 'my-project',
  image: 'proj.jpg',
  status: 'PUBLISHED',
  platforms: ['web'],
  technologies: ['TypeScript'],
  projectLinks: ['https://example.com'],
  content: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  translations: [],
}

beforeEach(() => jest.resetAllMocks())

describe('ProjectService.getAllProjects', () => {
  it('throws on SQL injection in search', async () => {
    await expect(
      ProjectService.getAllProjects({ page: 0, pageSize: 10, search: 'SELECT * FROM' }),
    ).rejects.toThrow('Invalid search query.')
  })

  it('returns projects and total with deletedAt: null filter', async () => {
    ;(prismaMock.$transaction as jest.Mock).mockResolvedValue([[mockProject], 1])

    const result = await ProjectService.getAllProjects({ page: 0, pageSize: 10 })

    expect(prismaMock.$transaction).toHaveBeenCalled()
    expect(result).toEqual({ projects: [mockProject], total: 1 })
  })

  it('applies pagination correctly', async () => {
    ;(prismaMock.$transaction as jest.Mock).mockResolvedValue([[], 0])

    await ProjectService.getAllProjects({ page: 3, pageSize: 5 })

    expect(prismaMock.project.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 15, take: 5 }))
    expect(prismaMock.project.count).toHaveBeenCalled()
    expect(prismaMock.$transaction).toHaveBeenCalled()
  })

  it('normalizes negative page and zero pageSize bounds', async () => {
    ;(prismaMock.$transaction as jest.Mock).mockResolvedValue([[], 0])

    await ProjectService.getAllProjects({ page: -5, pageSize: 0 })

    expect(prismaMock.project.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 1 }))
  })

  it('caps pageSize to max boundary', async () => {
    ;(prismaMock.$transaction as jest.Mock).mockResolvedValue([[], 0])

    await ProjectService.getAllProjects({ page: 0, pageSize: 999 })

    expect(prismaMock.project.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }))
  })
})

describe('ProjectService.getProjectById', () => {
  it('returns null when project is not found', async () => {
    ;(prismaMock.project.findFirst as jest.Mock).mockResolvedValue(null)
    const result = await ProjectService.getProjectById('nonexistent')
    expect(result).toBeNull()
  })

  it('returns project when found', async () => {
    ;(prismaMock.project.findFirst as jest.Mock).mockResolvedValue(mockProject)
    const result = await ProjectService.getProjectById('proj-1')
    expect(result).toEqual(mockProject)
  })
})

describe('ProjectService.createProject', () => {
  it('creates project and clears redis sitemap cache', async () => {
    ;(prismaMock.project.create as jest.Mock).mockResolvedValue(mockProject)
    ;(redisMock.del as jest.Mock).mockResolvedValue(1)

    const { projectId, createdAt, updatedAt, deletedAt, translations, ...createData } = mockProject
    const result = await ProjectService.createProject(createData as any)

    expect(redisMock.del).toHaveBeenCalledWith('sitemap:project')
    expect(prismaMock.project.create).toHaveBeenCalled()
    expect(result).toEqual(mockProject)
  })

  it('throws when required fields are missing', async () => {
    await expect(
      ProjectService.createProject({ title: '', description: '', slug: '', image: '', platforms: [], technologies: [], projectLinks: [] } as any),
    ).rejects.toThrow('Missing required fields.')
  })

  it('normalizes slug on create', async () => {
    ;(prismaMock.project.create as jest.Mock).mockResolvedValue(mockProject)
    ;(redisMock.del as jest.Mock).mockResolvedValue(1)

    await ProjectService.createProject({
      title: 'My Project',
      description: 'A test project',
      slug: '  My   Project  ',
      image: 'proj.jpg',
      status: 'PUBLISHED',
      platforms: ['web'],
      technologies: ['TypeScript'],
      projectLinks: ['https://example.com'],
      content: null,
      translations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as any)

    expect(prismaMock.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'my-project' }),
      }),
    )
  })
})

describe('ProjectService.updateProject', () => {
  it('updates project and clears redis sitemap cache', async () => {
    const updated = { ...mockProject, title: 'Updated Project' }
    ;(prismaMock.project.update as jest.Mock).mockResolvedValue(updated)
    ;(redisMock.del as jest.Mock).mockResolvedValue(1)

    const result = await ProjectService.updateProject({ ...mockProject, slug: '  Updated   Slug ' } as any)

    expect(redisMock.del).toHaveBeenCalledWith('sitemap:project')
    expect(prismaMock.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 'proj-1' },
        data: expect.objectContaining({ slug: 'updated-slug' }),
      }),
    )
    expect(result).toEqual(updated)
  })

  it('strips immutable fields from update payload', async () => {
    ;(prismaMock.project.update as jest.Mock).mockResolvedValue(mockProject)
    ;(redisMock.del as jest.Mock).mockResolvedValue(1)

    await ProjectService.updateProject(mockProject as any)

    const updateArg = (prismaMock.project.update as jest.Mock).mock.calls[0][0]
    expect(updateArg.data.projectId).toBeUndefined()
    expect(updateArg.data.createdAt).toBeUndefined()
    expect(updateArg.data.updatedAt).toBeUndefined()
    expect(updateArg.data.deletedAt).toBeUndefined()
    expect(updateArg.data.translations).toBeUndefined()
  })

  it('denies non-admin update when auth context is provided', async () => {
    await expect(
      ProjectService.updateProject(mockProject as any, { requesterRole: 'USER' }),
    ).rejects.toThrow('Forbidden.')
  })
})

describe('ProjectService.deleteProject', () => {
  it('soft deletes project and clears redis sitemap cache', async () => {
    ;(prismaMock.project.update as jest.Mock).mockResolvedValue({ ...mockProject, deletedAt: new Date() })
    ;(redisMock.del as jest.Mock).mockResolvedValue(1)

    await ProjectService.deleteProject('proj-1')

    expect(redisMock.del).toHaveBeenCalledWith('sitemap:project')
    expect(prismaMock.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 'proj-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    )
  })

  it('denies non-admin delete when auth context is provided', async () => {
    await expect(ProjectService.deleteProject('proj-1', { requesterRole: 'USER' })).rejects.toThrow(
      'Forbidden.'
    )
  })
})
