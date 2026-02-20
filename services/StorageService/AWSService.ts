import { s3 } from '@/libs/s3'
import {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'

export interface S3Object {
  key: string
  url: string
  size: number
  lastModified: Date
  folder: string
}

export default class AWSService {
  static allowedFolders = [
    'general',
    'categories',
    'users',
    'posts',
    'projects',
    'comments',
    'images',
    'videos',
    'audios',
    'files',
    'content',
  ]

  static allowedExtensions = ['jpeg', 'jpg', 'png', 'webp', 'avif']
  static allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

  /** Validate MIME type and extension consistency */
  private static validateFile(file: File, folder: string) {
    if (!file) throw new Error('No file provided')
    if (!AWSService.allowedFolders.includes(folder)) throw new Error('INVALID_FOLDER_NAME')

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !AWSService.allowedExtensions.includes(extension))
      throw new Error(`Invalid file extension: .${extension}`)

    const mimeType = file.type
    if (!mimeType || !AWSService.allowedMimeTypes.includes(mimeType))
      throw new Error(`Invalid MIME type: ${mimeType}`)
  }

  /**
   * List all files in S3 bucket with optional folder filter
   */
  static listFiles = async (folder?: string): Promise<S3Object[]> => {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: folder ? `${folder}/` : undefined,
    })

    const response = await s3.send(command)
    const objects: S3Object[] = []

    if (response.Contents) {
      for (const item of response.Contents) {
        if (item.Key && item.Size && item.Size > 0) {
          const itemFolder = item.Key.split('/')[0]
          objects.push({
            key: item.Key,
            url: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${item.Key}`,
            size: item.Size,
            lastModified: item.LastModified || new Date(),
            folder: itemFolder,
          })
        }
      }
    }

    return objects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
  }

  /**
   * Delete a file from S3 bucket
   */
  static deleteFile = async (key: string): Promise<boolean> => {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    })

    await s3.send(command)
    return true
  }

  /**
   * Get file metadata
   */
  static getFileMetadata = async (
    key: string
  ): Promise<{ size: number; contentType: string; lastModified: Date } | null> => {
    try {
      const command = new HeadObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })

      const response = await s3.send(command)
      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
      }
    } catch {
      return null
    }
  }

  static uploadFile = async (
    file: File,
    folder: string = 'general'
  ): Promise<string | undefined> => {
    this.validateFile(file, folder)

    const randomString = Math.random().toString(36).slice(2, 10)
    const extension = file.name.split('.').pop()?.toLowerCase()
    const timestamp = Date.now()
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    if (!AWSService.allowedFolders.includes(folder)) throw new Error('INVALID_FOLDER_NAME')

    const fileKey = `${folder}/${timestamp}-${randomString}.${extension}`
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: file.type,
    })

    await s3.send(command)
    return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`
  }

  static uploadFromUrl = async (
    url: string,
    folder: string = 'general'
  ): Promise<string | undefined> => {
    if (!AWSService.allowedFolders.includes(folder)) throw new Error('INVALID_FOLDER_NAME')

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
  }
}
