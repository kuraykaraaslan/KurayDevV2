import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import AWSService from '@/services/StorageService/AWSService'
import { prisma } from '@/libs/prisma'

export async function GET(request: NextRequest) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

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
    const session = await UserSessionService.authenticateUserByRequest({ request })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'general'

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

    const url = await AWSService.uploadFile(file, folder)

    if (!url) {
      return NextResponse.json({ message: 'Upload failed' }, { status: 500 })
    }

    // Extract the S3 key from the returned public URL
    const key = new URL(url).pathname.slice(1)

    const media = await prisma.media.create({
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
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const body = await request.json()
    const { key } = body

    if (!key) {
      return NextResponse.json({ message: 'No file key provided' }, { status: 400 })
    }

    await AWSService.deleteFile(key)

    // Remove from DB — deleteMany to avoid throwing if key was never tracked
    await prisma.media.deleteMany({ where: { key } })

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting media:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
