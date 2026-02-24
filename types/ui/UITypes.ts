import { z } from 'zod'

const MenuItemSchema = z.object({
  id: z.string().nullable(),
  page: z.string(),
  name: z.string(),
  icon: z.any().optional(), // IconDefinition is not directly supported by Zod
  external: z.boolean().default(false),
  onlyAdmin: z.boolean().optional().default(false),
  textColour: z.string().optional(),
  backgroundColour: z.string().optional(),
  hideTextOnDesktop: z.boolean().default(false),
})

// =========================
// UI Types
// =========================

export type MenuItem = z.infer<typeof MenuItemSchema>
export { MenuItemSchema }

export const AppThemeEnum = z.enum(['light', 'dark'])
export const AppThemeSchema = AppThemeEnum.default('dark')

export type AppTheme = z.infer<typeof AppThemeEnum>

export const AVAILABLE_THEMES = AppThemeEnum.options

export const DEFAULT_THEME: AppTheme = 'dark'
