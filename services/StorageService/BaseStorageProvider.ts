import { S3Client } from '@aws-sdk/client-s3'
import {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { S3Object } from '@/types/features/StorageTypes'

export interface StorageConfig {
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  endpoint?: string
  publicUrl?: string
  forcePathStyle?: boolean
}

export interface FileMetadata {
  size: number
  contentType: string
  lastModified: Date
}

export abstract class BaseStorageProvider {
  protected client: S3Client
  protected config: StorageConfig
  protected providerName: string

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

  constructor(config: StorageConfig, providerName: string) {
    this.config = config
    this.providerName = providerName
    this.client = this.createClient()
  }

  protected createClient(): S3Client {
    const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    }

    if (this.config.endpoint) {
      clientConfig.endpoint = this.config.endpoint
    }

    if (this.config.forcePathStyle !== undefined) {
      clientConfig.forcePathStyle = this.config.forcePathStyle
    }

    return new S3Client(clientConfig)
  }

  /** Generate public URL for a file key */
  protected abstract getPublicUrl(key: string): string

  /** Validate MIME type and extension consistency */
  protected validateFile(file: File, folder: string): void {
    if (!file) throw new Error('No file provided')
    if (!BaseStorageProvider.allowedFolders.includes(folder)) {
      throw new Error('INVALID_FOLDER_NAME')
    }

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !BaseStorageProvider.allowedExtensions.includes(extension)) {
      throw new Error(`Invalid file extension: .${extension}`)
    }

    const mimeType = file.type
    if (!mimeType || !BaseStorageProvider.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`Invalid MIME type: ${mimeType}`)
    }
  }

  /** Generate unique file key */
  protected generateFileKey(folder: string, originalName: string): string {
    const randomString = Math.random().toString(36).slice(2, 10)
    const extension = originalName.split('.').pop()?.toLowerCase()
    const timestamp = Date.now()
    return `${folder}/${timestamp}-${randomString}.${extension}`
  }

  /**
   * List all files in bucket with optional folder filter
   */
  async listFiles(folder?: string): Promise<S3Object[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.config.bucket,
      Prefix: folder ? `${folder}/` : undefined,
    })

    const response = await this.client.send(command)
    const objects: S3Object[] = []

    if (response.Contents) {
      for (const item of response.Contents) {
        if (item.Key && item.Size && item.Size > 0) {
          const itemFolder = item.Key.split('/')[0]
          objects.push({
            key: item.Key,
            url: this.getPublicUrl(item.Key),
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
   * Delete a file from bucket
   */
  async deleteFile(key: string): Promise<boolean> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    })

    await this.client.send(command)
    return true
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })

      const response = await this.client.send(command)
      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
      }
    } catch {
      return null
    }
  }

  /**
   * Upload a file
   */
  async uploadFile(file: File, folder: string = 'general'): Promise<string | undefined> {
    this.validateFile(file, folder)

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileKey = this.generateFileKey(folder, file.name)

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: file.type,
    })

    await this.client.send(command)
    return this.getPublicUrl(fileKey)
  }

  /**
   * Upload file from URL
   */
  async uploadFromUrl(url: string, folder: string = 'general'): Promise<string | undefined> {
    if (!BaseStorageProvider.allowedFolders.includes(folder)) {
      throw new Error('INVALID_FOLDER_NAME')
    }

    const response = await fetch(url)
    const mimeType = response.headers.get('content-type') || 'application/octet-stream'

    if (!BaseStorageProvider.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`Invalid MIME type from URL: ${mimeType}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)
    const timestamp = Date.now()
    const filename = url.split('?')[0].split('/').pop() || 'file'
    const fileKey = `${folder}/${timestamp}-${filename}`

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
    })

    await this.client.send(command)
    return this.getPublicUrl(fileKey)
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return this.providerName
  }
}
