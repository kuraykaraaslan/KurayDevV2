import { z } from 'zod';

export const PlatformSchema = z.object({
    name: z.string().min(1, 'Platform name is required'),
    icon: z.string().min(1, 'Icon is required'),
    url: z.string().url('Must be a valid URL'),
    bgColor: z.string().optional(),
    borderColor: z.string().optional(),
    zoom: z.number().positive().optional(),
});

export type Platform = z.infer<typeof PlatformSchema>;