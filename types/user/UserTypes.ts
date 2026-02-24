import { z } from 'zod'
import { UserSecuritySchema, UserSecurityDefault } from './UserSecurityTypes'
import { UserProfileSchema, UserProfileDefault } from './UserProfileTypes'
import { AppLanguageEnum } from '@/types/common/I18nTypes'

export const UserRoleEnum = z.enum(['ADMIN', 'USER']).default('USER')
export const UserStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).default('ACTIVE')

export const ThemeEnum = z.enum(['LIGHT', 'DARK', 'SYSTEM'])
export const ThemeSchema = ThemeEnum.default('SYSTEM')

export const LanguageEnum = AppLanguageEnum
export const LanguageSchema = AppLanguageEnum.default('en')

export const UserPreferencesSchema = z.object({
  theme: ThemeEnum.optional().default('SYSTEM'),
  language: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    AppLanguageEnum
  ).optional().default('en'),
  emailNotifications: z.boolean().optional().default(true),
  smsNotifications: z.boolean().optional().default(false),
  pushNotifications: z.boolean().optional().default(true),
  newsletter: z.boolean().optional().default(true),
  timezone: z.string().default('UTC'),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY']).default('DD/MM/YYYY'),
  timeFormat: z.enum(['24H', '12H']).default('24H'),
  firstDayOfWeek: z.enum(['MON', 'SUN']).default('MON'),
})

export const UserPreferencesDefault: z.infer<typeof UserPreferencesSchema> = {
  theme: ThemeEnum.enum.SYSTEM,
  language: AppLanguageEnum.enum.en,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  newsletter: true,
  timezone: 'UTC',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24H',
  firstDayOfWeek: 'MON',
}

export const UserSchema = z.object({
  userId: z.string(),

  email: z.string().email(),
  phone: z.string().nullable().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),

  userRole: UserRoleEnum.default('USER'),
  userStatus: UserStatusEnum.default('ACTIVE'),

  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().nullable().optional(),

  userPreferences: UserPreferencesSchema.nullable().transform(
    (prefs) => prefs || UserPreferencesDefault
  ),
  userSecurity: UserSecuritySchema.nullable().transform((sec) => sec || UserSecurityDefault),
  userProfile: UserProfileSchema.nullable().transform((profile) => profile || UserProfileDefault),
})

export const SafeUserSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),

  name: z.string().nullable().optional(),

  userRole: z.string(),
  userStatus: z.string(),

  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),

  userPreferences: UserPreferencesSchema.nullable().transform(
    (prefs) => prefs || UserPreferencesDefault
  ),
  userProfile: UserProfileSchema.nullable().transform((profile) => profile || UserProfileDefault),
})

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  userRole: UserRoleEnum.optional(),
  userStatus: UserStatusEnum.optional(),
  userPreferences: UserPreferencesSchema.partial().optional(),
  userProfile: UserProfileSchema.partial().optional(),
})

export type SafeUser = z.infer<typeof SafeUserSchema>
export type User = z.infer<typeof UserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
export type UserRole = z.infer<typeof UserRoleEnum>
export type UserStatus = z.infer<typeof UserStatusEnum>
export type UserPreferences = z.infer<typeof UserPreferencesSchema>
