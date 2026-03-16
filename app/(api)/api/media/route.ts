import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import AWSService from '@/services/StorageService/AWSService'
import { prisma } from '@/libs/prisma'
import { DeleteMediaRequestSchema } from '@/dtos/MediaDTO'
import MediaMessages from '@/messages/MediaMessages'

export async function GET(request: NextRequest) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || undefined
    const page = parseInt(searchParams.get('page') || '0', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '24', 10)
    const search = searchParams.get('search') || undefined

    const where = {
      ...(folder ? { folder } : {}),
      ...(search
        ? {
            OR: [
              { key: { contains: search, mode: 'insensitive' as const } },
              { name: { contains: search, mode: 'insensitive' as const } },
              { originalName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [files, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.media.count({ where }),
    ])

    return NextResponse.json({
      files,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      folders: AWSService.allowedFolders,
    })
  } catch (error: any) {
    console.error('Error listing media:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await AuthMiddleware.authenticateUserByRequest({ request })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'general'

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

    if (!AWSService.allowedFolders.includes(folder)) {
      return NextResponse.json({ message: 'Invalid folder' }, { status: 400 })
    }

    const url = await AWSService.uploadFile(file, folder)

    if (!url) {
      return NextResponse.json({ message: 'Upload failed' }, { status: 500 })
    }

    // Extract the S3 key from the returned public URL
    const key = new URL(url).pathname.slice(1)

    const media = await (async () => {
      try {
        return await prisma.media.create({
          data: {
            key,
            url,
            folder,
            mimeType: file.type,
            size: file.size,
            originalName: file.name,
            uploadedBy: session.user.userId,
          },
        })
      } catch (dbError) {
        try {
          await AWSService.deleteFile(key)
        } catch (storageRollbackError) {
          console.error('Error rolling back uploaded file after DB failure:', storageRollbackError)
        }
        throw dbError
      }
    })()

    return NextResponse.json({
      message: 'File uploaded successfully',
      url,
      media,
    })
  } catch (error: any) {
    console.error('Error uploading media:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const body = await request.json()
    
    const parsed = DeleteMediaRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { key } = parsed.data

    const existing = await prisma.media.findFirst({ where: { key } })

    // Remove from DB first; if storage deletion fails we compensate by restoring the DB row.
    await prisma.media.deleteMany({ where: { key } })

    try {
      await AWSService.deleteFile(key)
    } catch (storageError) {
      if (existing) {
        await prisma.media.upsert({
          where: { key: existing.key },
          update: {
            url: existing.url,
            folder: existing.folder,
            mimeType: existing.mimeType,
            size: existing.size,
            name: existing.name,
            altText: existing.altText,
            originalName: existing.originalName,
            uploadedBy: existing.uploadedBy,
          },
          create: {
            key: existing.key,
            url: existing.url,
            folder: existing.folder,
            mimeType: existing.mimeType,
            size: existing.size,
            name: existing.name,
            altText: existing.altText,
            originalName: existing.originalName,
            uploadedBy: existing.uploadedBy,
          },
        })
      }

      throw storageError
    }

    return NextResponse.json({ message: MediaMessages.MEDIA_DELETED_SUCCESS })
  } catch (error: any) {
    console.error('Error deleting media:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
