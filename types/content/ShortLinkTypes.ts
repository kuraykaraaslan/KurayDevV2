export type ShortLink = {
  id: string
  code: string
  originalUrl: string
  clicks: number
  createdAt: string | Date
  deletedAt?: string | Date | null
  [key: string]: unknown
}
