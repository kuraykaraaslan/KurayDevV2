import { s3 } from '@/libs/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export default class AWSService {
  static allowedFolders = [
    'general',
    'categories',
    'users',
    'posts',
    'comments',
    'images',
    'videos',
    'audios',
    'files',
    'content',
  ]

  static allowedExtensions = ['jpeg', 'jpg', 'png', 'webp', 'avif']
  static allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
  ]

  /** Validate MIME type and extension consistency */
  private static validateFile(file: File, folder: string) {
    if (!file) throw new Error('No file provided')
    if (!AWSService.allowedFolders.includes(folder)) throw new Error('Invalid folder name')

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !AWSService.allowedExtensions.includes(extension))
      throw new Error(`Invalid file extension: .${extension}`)

    const mimeType = file.type
    if (!mimeType || !AWSService.allowedMimeTypes.includes(mimeType))
      throw new Error(`Invalid MIME type: ${mimeType}`)
  }

  static uploadFile = async (file: File, folder: string = 'general'): Promise<string | undefined> => {
    try {
      this.validateFile(file, folder)

      const randomString = Math.random().toString(36).slice(2, 10)
      const extension = file.name.split('.').pop()?.toLowerCase()
      const timestamp = Date.now()
      const fileBuffer = Buffer.from(await file.arrayBuffer())

      const fileKey = `${folder}/${timestamp}-${randomString}.${extension}`
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: file.type, // ✅ S3 metadata
      })

      await s3.send(command)
      return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  static uploadFromUrl = async (url: string, folder: string = 'general'): Promise<string | undefined> => {
    try {
      if (!AWSService.allowedFolders.includes(folder)) throw new Error('Invalid folder name')

      const response = await fetch(url)
      const mimeType = response.headers.get('content-type') || 'application/octet-stream'

      if (!AWSService.allowedMimeTypes.includes(mimeType)) {
        throw new Error(`Invalid MIME type from URL: ${mimeType}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer)
      const timestamp = Date.now()
      const filename = url.split('?')[0].split('/').pop() || 'file'
      const fileKey = `${folder}/${timestamp}-${filename}`

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: mimeType,
      })

      await s3.send(command)
      return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`
    } catch (error) {
      console.error('Error uploading file from URL:', error)
    }
  }
}
