
import { z } from 'zod';

const UserRole = z.enum(['ADMIN', 'USER']).default('USER');
const OTPMethod = z.enum(['EMAIL', 'SMS', 'TOTP_APP', 'PUSH_APP']);
const UserStatus = z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).default('ACTIVE');

const User = z.object({
    userId: z.string(),
    email: z.string().email(),
    phone: z.string().nullable().optional(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    name: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    userRole: UserRole.default('USER'),
    userStatus: UserStatus.optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().nullable().optional(),
    profilePicture: z.string().nullable().optional(),
    otpMethods: z.array(OTPMethod).default([]),
    otpSecret: z.string().nullable().optional(),

    headerImage: z.string().nullable().optional(),
    biography: z.string().nullable().optional(),
});


const SafeUser = z.object({
    userId: z.string(),
    email: z.string().email(),
    phone: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    userRole: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    profilePicture: z.string().nullable().optional(),
    otpMethods: z.array(OTPMethod).optional(),

    headerImage: z.string().nullable().optional(),
    biography: z.string().nullable().optional(),
});


export type SafeUser = z.infer<typeof SafeUser>;
export type User = z.infer<typeof User>;
export type UserRole = z.infer<typeof UserRole>;
export type OTPMethod = z.infer<typeof OTPMethod>;
export type UserStatus = z.infer<typeof UserStatus>;

export { SafeUser, User, UserRole, OTPMethod, UserStatus };