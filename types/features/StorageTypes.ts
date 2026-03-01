import { z } from 'zod'

export const S3ObjectSchema = z.object({
  key: z.string(),
  url: z.string(),
  size: z.number(),
  lastModified: z.date(),
  folder: z.string(),
})

export type S3Object = z.infer<typeof S3ObjectSchema>
