import { BaseStorageProvider, StorageConfig } from './BaseStorageProvider'
import { S3Object } from '@/types/features/StorageTypes'

/**
 * MinIO Storage Service
 * Extends BaseStorageProvider for MinIO-compatible storage operations
 *
 * MinIO is an open-source, S3-compatible object storage server.
 * Can be self-hosted or used as a managed service.
 *
 * Environment variables:
 * - MINIO_ENDPOINT: MinIO server endpoint (e.g., http://localhost:9000 or https://minio.example.com)
 * - MINIO_ACCESS_KEY: MinIO access key
 * - MINIO_SECRET_KEY: MinIO secret key
 * - MINIO_BUCKET_NAME: MinIO bucket name
 * - MINIO_REGION: Region (default: us-east-1)
 * - MINIO_USE_SSL: Use SSL (default: true)
 * - MINIO_PUBLIC_URL: Optional public URL for file access
 */
export class MinioService extends BaseStorageProvider {
  private publicUrl?: string

  constructor(config?: Partial<StorageConfig>) {
    const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000'
    const defaultConfig: StorageConfig = {
      region: process.env.MINIO_REGION || 'us-east-1',
      accessKeyId: process.env.MINIO_ACCESS_KEY || '',
      secretAccessKey: process.env.MINIO_SECRET_KEY || '',
      bucket: process.env.MINIO_BUCKET_NAME || '',
      endpoint: endpoint,
      forcePathStyle: true, // MinIO requires path-style URLs
      ...config,
    }
    super(defaultConfig, 'MinIO')
    this.publicUrl = config?.publicUrl || process.env.MINIO_PUBLIC_URL
  }

  protected getPublicUrl(key: string): string {
    // If custom public URL is provided
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`
    }
    // Default MinIO URL format (path-style)
    const endpoint = this.config.endpoint || 'http://localhost:9000'
    return `${endpoint}/${this.config.bucket}/${key}`
  }

  // ============================================
  // Static methods for convenience
  // ============================================

  private static instance: MinioService | null = null

  private static getInstance(): MinioService {
    if (!MinioService.instance) {
      MinioService.instance = new MinioService()
    }
    return MinioService.instance
  }

  static allowedFolders = BaseStorageProvider.allowedFolders
  static allowedExtensions = BaseStorageProvider.allowedExtensions
  static allowedMimeTypes = BaseStorageProvider.allowedMimeTypes

  /**
   * List all files in MinIO bucket with optional folder filter
   */
  static listFiles = async (folder?: string): Promise<S3Object[]> => {
    return MinioService.getInstance().listFiles(folder)
  }

  /**
   * Delete a file from MinIO bucket
   */
  static deleteFile = async (key: string): Promise<boolean> => {
    return MinioService.getInstance().deleteFile(key)
  }

  /**
   * Get file metadata
   */
  static getFileMetadata = async (
    key: string
  ): Promise<{ size: number; contentType: string; lastModified: Date } | null> => {
    return MinioService.getInstance().getFileMetadata(key)
  }

  /**
   * Upload a file to MinIO
   */
  static uploadFile = async (file: File, folder: string = 'general'): Promise<string | undefined> => {
    return MinioService.getInstance().uploadFile(file, folder)
  }

  /**
   * Upload file from URL to MinIO
   */
  static uploadFromUrl = async (url: string, folder: string = 'general'): Promise<string | undefined> => {
    return MinioService.getInstance().uploadFromUrl(url, folder)
  }
}

export default MinioService
