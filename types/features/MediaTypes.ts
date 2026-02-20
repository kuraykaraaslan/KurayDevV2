export interface MediaFile {
  mediaId: string
  key: string
  url: string
  folder: string
  mimeType?: string
  size: number
  name?: string
  altText?: string
  originalName?: string
  uploadedBy?: string
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}
