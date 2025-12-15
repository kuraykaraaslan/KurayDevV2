
import { z } from 'zod';
import { OTPMethodEnum, UserSecuritySchema, UserSecurityDefault } from './UserSecurityTypes';

const UserRoleEnum = z.enum(['ADMIN', 'USER']).default('USER');
const UserStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).default('ACTIVE');

const ThemeEnum = z.enum(['LIGHT', 'DARK', 'SYSTEM']);
export const ThemeSchema = ThemeEnum.default("SYSTEM");

const LanguageEnum = z.enum(['EN', 'ES', 'FR', 'DE', 'CN', 'JP']);
export const LanguageSchema = LanguageEnum.default("EN");

const UserPreferencesSchema = z.object({
  theme: ThemeEnum.optional().default('SYSTEM'),
  language: LanguageEnum.optional().default('EN'),
  emailNotifications: z.boolean().optional().default(true),
  smsNotifications: z.boolean().optional().default(false),
  pushNotifications: z.boolean().optional().default(true),
  newsletter: z.boolean().optional().default(true),
});

const UserPreferencesDefault : z.infer<typeof UserPreferencesSchema> = {
    theme: ThemeEnum.enum.SYSTEM,
    language: LanguageEnum.enum.EN,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    newsletter: true,
};

const UserProfileSchema = z.object({
    name: z.string().nullable().optional(),
    biography: z.string().nullable().optional(),
    profilePicture: z.string().nullable().optional(),
    headerImage: z.string().nullable().optional(),
});

const UserProfileDefault : z.infer<typeof UserProfileSchema> = {
    name: null,
    biography: null,
    profilePicture: null,
    headerImage: null,
};

const UserSchema = z.object({
    userId: z.string(),

    email: z.string().email(),
    phone: z.string().nullable().optional(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    
    userRole: UserRoleEnum.default('USER'),
    userStatus: UserStatusEnum.default('ACTIVE'),

    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().nullable().optional(),

    userPreferences: UserPreferencesSchema.nullable().transform((prefs) => prefs || UserPreferencesDefault),
    userSecurity: UserSecuritySchema.nullable().transform((sec) => sec || UserSecurityDefault),
    userProfile: UserProfileSchema.nullable().transform((profile) => profile || UserProfileDefault),

});


const SafeUserSchema = z.object({
    userId: z.string(),
    email: z.string().email(),
    phone: z.string().nullable().optional(),

    name: z.string().nullable().optional(),

    userRole: z.string(),
    userStatus: z.string(),


    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),

    userPreferences: UserPreferencesSchema.nullable().transform((prefs) => prefs || UserPreferencesDefault),
    userProfile: UserProfileSchema.nullable().transform((profile) => profile || UserProfileDefault),
});

const UpdateUserSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().nullable().optional(),
    name: z.string().nullable().optional(),

    userRole: UserRoleEnum.optional(),
    userStatus: UserStatusEnum.optional(),

    userPreferences: UserPreferencesSchema.partial().optional(),
    userProfile: UserProfileSchema.partial().optional(),
});


export type SafeUser = z.infer<typeof SafeUserSchema>;
export type User = z.infer<typeof UserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UserRole = z.infer<typeof UserRoleEnum>;
export type UserStatus = z.infer<typeof UserStatusEnum>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export { SafeUserSchema, UserSchema, UserRoleEnum, OTPMethodEnum, UserStatusEnum, ThemeEnum, LanguageEnum, UpdateUserSchema, UserPreferencesSchema, UserPreferencesDefault, UserProfileSchema, UserProfileDefault };