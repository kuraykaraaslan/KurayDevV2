'use server'

import { NextResponse } from 'next/server'
import AWSService from '@/services/StorageService/AWSService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import AIMessages from '@/messages/AIMessages'

/**
 * POST handler for uploading a file to an S3 bucket.
 * @param req - The incoming request object
 * @returns A NextResponse containing the S3 URL or an error message
 */
export async function POST(request: NextRequest) {
  try {
    await UserSessionService.authenticateUserByRequest({ request })

    const formData = await request.formData()

    const file = formData.get('file')
    const folder = formData.get('folder')

    if (!file) {
      return NextResponse.json({ message: AIMessages.FILE_REQUIRED }, { status: 400 })
    }

    const url = await AWSService.uploadFile(file as File, folder as string)

    return NextResponse.json({ url })
  } catch (error: any) {
    console.error(error.message)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
