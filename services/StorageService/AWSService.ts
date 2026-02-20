import { BaseStorageProvider, StorageConfig } from './BaseStorageProvider'
import { S3Object } from '@/types/features/StorageTypes'

/**
 * AWS S3 Storage Service
 * Extends BaseStorageProvider for S3-compatible storage operations
 */
export class AWSService extends BaseStorageProvider {
  constructor(config?: Partial<StorageConfig>) {
    const defaultConfig: StorageConfig = {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      bucket: process.env.AWS_BUCKET_NAME || '',
      ...config,
    }
    super(defaultConfig, 'AWS S3')
  }

  protected getPublicUrl(key: string): string {
    return `https://${this.config.bucket}.s3.amazonaws.com/${key}`
  }

  // ============================================
  // Static methods for backwards compatibility
  // ============================================

  private static instance: AWSService | null = null

  private static getInstance(): AWSService {
    if (!AWSService.instance) {
      AWSService.instance = new AWSService()
    }
    return AWSService.instance
  }

  static allowedFolders = BaseStorageProvider.allowedFolders
  static allowedExtensions = BaseStorageProvider.allowedExtensions
  static allowedMimeTypes = BaseStorageProvider.allowedMimeTypes

  /**
   * List all files in S3 bucket with optional folder filter
   */
  static listFiles = async (folder?: string): Promise<S3Object[]> => {
    return AWSService.getInstance().listFiles(folder)
  }

  /**
   * Delete a file from S3 bucket
   */
  static deleteFile = async (key: string): Promise<boolean> => {
    return AWSService.getInstance().deleteFile(key)
  }

  /**
   * Get file metadata
   */
  static getFileMetadata = async (
    key: string
  ): Promise<{ size: number; contentType: string; lastModified: Date } | null> => {
    return AWSService.getInstance().getFileMetadata(key)
  }

  /**
   * Upload a file to S3
   */
  static uploadFile = async (file: File, folder: string = 'general'): Promise<string | undefined> => {
    return AWSService.getInstance().uploadFile(file, folder)
  }

  /**
   * Upload file from URL to S3
   */
  static uploadFromUrl = async (url: string, folder: string = 'general'): Promise<string | undefined> => {
    return AWSService.getInstance().uploadFromUrl(url, folder)
  }
}

export default AWSService
