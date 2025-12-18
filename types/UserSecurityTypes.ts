import { z } from 'zod';

const OTPMethodEnum = z.enum(['EMAIL', 'SMS', 'TOTP_APP', 'PUSH_APP']);
const OTPActionEnum = z.enum(['enable', 'disable', 'authenticate']);

export { OTPMethodEnum, OTPActionEnum };
export type OTPMethod = z.infer<typeof OTPMethodEnum>;
export type OTPAction = z.infer<typeof OTPActionEnum>;


const UserSecurityDefault = {
    otpMethods: [] as z.infer<typeof OTPMethodEnum>[],
    otpSecret: null as string | null,
    otpBackupCodes: [] as string[],
    lastLoginAt: null as Date | null,
    lastLoginIp: null as string | null,
    lastLoginDevice: null as string | null,
    failedLoginAttempts: 0 as number,
    lockedUntil: null as Date | null,
};

const UserSecuritySchema = z.object({
    otpMethods: z.array(OTPMethodEnum).default([]),
    otpSecret: z.string().nullable().optional(),
    otpBackupCodes: z.array(z.string()).default([]),
    lastLoginAt: z.date().nullable().optional(),
    lastLoginIp: z.string().nullable().optional(),
    lastLoginDevice: z.string().nullable().optional(),
    failedLoginAttempts: z.number().default(0),
    lockedUntil: z.date().nullable().optional(),
});

const SafeUserSecuritySchema = UserSecuritySchema.omit({
    otpSecret: true,
    otpBackupCodes: true,
});

export type SafeUserSecurity = z.infer<typeof SafeUserSecuritySchema>;

const SafeUserSecurityDefault = {
    otpMethods: [] as z.infer<typeof OTPMethodEnum>[],
    lastLoginAt: null as Date | null,
    lastLoginIp: null as string | null,
    lastLoginDevice: null as string | null,
    failedLoginAttempts: 0 as number,
    lockedUntil: null as Date | null,
};

export { SafeUserSecuritySchema, SafeUserSecurityDefault };

export type UserSecurity = z.infer<typeof UserSecuritySchema>;
export { UserSecuritySchema, UserSecurityDefault };