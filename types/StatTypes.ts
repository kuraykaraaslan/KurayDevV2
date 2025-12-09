import { z } from "zod";

export const StatSchema = z.object({
  totalPosts: z.number().int().nonnegative(),
  totalCategories: z.number().int().nonnegative(),
  totalUsers: z.number().int().nonnegative(),
  totalViews: z.number().int().nonnegative(),
  totalComments: z.number().int().nonnegative(),
});

export type Stat = z.infer<typeof StatSchema>;