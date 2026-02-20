import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import AWSService from '@/services/StorageService/AWSService'

export async function GET(request: NextRequest) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || undefined
    const page = parseInt(searchParams.get('page') || '0', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '24', 10)
    const search = searchParams.get('search') || undefined

    let files = await AWSService.listFiles(folder)

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase()
      files = files.filter(
        (file) =>
          file.key.toLowerCase().includes(searchLower) ||
          file.folder.toLowerCase().includes(searchLower)
      )
    }

    const total = files.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = page * pageSize
    const paginatedFiles = files.slice(startIndex, startIndex + pageSize)

    return NextResponse.json({
      files: paginatedFiles,
      total,
      page,
      pageSize,
      totalPages,
      folders: AWSService.allowedFolders,
    })
  } catch (error: any) {
    console.error('Error listing media:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'general'

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

    const url = await AWSService.uploadFile(file, folder)

    return NextResponse.json({
      message: 'File uploaded successfully',
      url,
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

    return NextResponse.json({
      message: 'File deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting media:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
