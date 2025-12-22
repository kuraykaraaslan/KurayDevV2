import { z } from 'zod';

export const SSOProfileResponseSchema = z.object({
    sub: z.string(),
    name: z.string().optional(),
    email: z.string(),
    picture: z.string().optional(),
    provider: z.string(),
});

export type SSOProfileResponse = z.infer<typeof SSOProfileResponseSchema>;

