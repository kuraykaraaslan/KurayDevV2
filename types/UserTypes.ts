
import { z } from 'zod';

const UserRoleEnum = z.enum(['ADMIN', 'USER']).default('USER');
const OTPMethodEnum = z.enum(['EMAIL', 'SMS', 'TOTP_APP', 'PUSH_APP']);
const UserStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).default('ACTIVE');

const UserSchema = z.object({
    userId: z.string(),
    email: z.string().email(),
    phone: z.string().nullable().optional(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    name: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    userRole: UserRoleEnum.default('USER'),
    userStatus: UserStatusEnum.optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().nullable().optional(),
    profilePicture: z.string().nullable().optional(),
    otpMethods: z.array(OTPMethodEnum).default([]),
    otpSecret: z.string().nullable().optional(),

    headerImage: z.string().nullable().optional(),
    biography: z.string().nullable().optional(),
});


const SafeUserSchema = z.object({
    userId: z.string(),
    email: z.string().email(),
    phone: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    userRole: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    profilePicture: z.string().nullable().optional(),
    otpMethods: z.array(OTPMethodEnum).optional(),

    headerImage: z.string().nullable().optional(),
    biography: z.string().nullable().optional(),
});

const UpdateUserSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    userRole: UserRoleEnum.optional(),
    userStatus: UserStatusEnum.optional(),
    profilePicture: z.string().nullable().optional(),
    otpMethods: z.array(OTPMethodEnum).optional(),
    headerImage: z.string().nullable().optional(),
    biography: z.string().nullable().optional(),
});


export type SafeUser = z.infer<typeof SafeUserSchema>;
export type User = z.infer<typeof UserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UserRole = z.infer<typeof UserRoleEnum>;
export type OTPMethod = z.infer<typeof OTPMethodEnum>;
export type UserStatus = z.infer<typeof UserStatusEnum>;

export { SafeUserSchema, UserSchema, UserRoleEnum, OTPMethodEnum, UserStatusEnum, UpdateUserSchema };