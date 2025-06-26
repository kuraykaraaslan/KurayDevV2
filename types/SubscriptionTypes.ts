import { z } from "zod";

const Subscription = z.object({
  email: z.string().email(),
  createdAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Subscription = z.infer<typeof Subscription>;    
export { Subscription };