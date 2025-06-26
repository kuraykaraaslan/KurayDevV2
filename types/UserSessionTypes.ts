import {z} from 'zod';

const UserAgentData = z.object({
    os: z.string().nullable(),
    device: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    ip: z.string().nullable(),
    browser: z.string().nullable(),
});

const SafeUserSession = z.object({
    userSessionId: z.string(),
    userId: z.string(),
    otpVerifyNeeded: z.boolean(),
    sessionExpiry: z.date(),
});



export type SafeUserSession = z.infer<typeof SafeUserSession>;
export type UserAgentData = z.infer<typeof UserAgentData>;

export { SafeUserSession, UserAgentData };