'use server'

import { NextResponse } from 'next/server'
import AWSService from '@/services/StorageService/AWSService'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import { UploadFromUrlRequestSchema } from '@/dtos/MediaDTO'
import MediaMessages from '@/messages/MediaMessages'

/**
 * POST handler for uploading a file to an S3 bucket.
 * @param req - The incoming request object
 * @returns A NextResponse containing the S3 URL or an error message
 */
export async function POST(request: NextRequest) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request })

    const body = await request.json()
    
    const parsed = UploadFromUrlRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { url, folder } = parsed.data

    const urlReloaded = await AWSService.uploadFromUrl(url, folder)

    return NextResponse.json({ message: MediaMessages.MEDIA_UPLOADED_SUCCESS, url: urlReloaded })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || MediaMessages.UPLOAD_FAILED }, { status: 500 })
  }
}
