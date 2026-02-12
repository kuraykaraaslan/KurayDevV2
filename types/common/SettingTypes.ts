import { z } from 'zod'

const SettingSchema = z.object({
  key: z.string(),
  value: z.string(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  group: z.string().default('general'),
  type: z.string().default('string'),
})

export type Setting = z.infer<typeof SettingSchema>
export { SettingSchema }
