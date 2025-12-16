import { z } from 'zod';

export const SingleSocialLinkEnum = z.enum([
  // =========================
  // Core Developer Platforms
  // =========================
  'GITHUB',
  'GITLAB',
  'BITBUCKET',
  'STACKOVERFLOW',
  'NPM',
  'PYPI',

  // =========================
  // Blogging & Writing
  // =========================
  'DEVTO',
  'MEDIUM',
  'HASHNODE',
  'SUBSTACK',

  // =========================
  // Professional & Career
  // =========================
  'LINKEDIN',
  'WEBSITE',
  'EMAIL',
  'CALENDLY',

  // =========================
  // Social Media
  // =========================
  'TWITTER',
  'FACEBOOK',
  'INSTAGRAM',
  'YOUTUBE',
  'TIKTOK',
  'SNAPCHAT',
  'REDDIT',
  'PINTEREST',

  // =========================
  // Community & Messaging
  // =========================
  'DISCORD',
  'SLACK',
  'TELEGRAM',
  'KEYBASE',
  'DISCOURSE',

  // =========================
  // Freelance / Consulting
  // =========================
  'UPWORK',
  'FREELANCER',
  'FIVERR',
  'TOPTAL',

  // =========================
  // Frontend / Playground
  // =========================
  'CODEPEN',
  'JSFIDDLE',

  // =========================
  // Competitive / Learning
  // =========================
  'LEETCODE',
  'HACKERRANK',
  'KAGGLE',
]);

export const SocialLinkItemSchema = z.object({
  id: z.string().uuid(),
  platform: SingleSocialLinkEnum,
  url: z.string().url().nullable(),
  order: z.number().int().nonnegative()
});

export const SocialLinksSchema = z
  .array(SocialLinkItemSchema)
  .default([]);

const UserProfileSchema = z.object({
    name: z.string().nullable().optional(),
    biography: z.string().nullable().optional(),
    profilePicture: z.string().nullable().optional(),
    headerImage: z.string().nullable().optional(),
    socialLinks: SocialLinksSchema.optional().default([]),
});

const UserProfileDefault: z.infer<typeof UserProfileSchema> = {
    name: null,
    biography: null,
    profilePicture: null,
    headerImage: null,
    socialLinks: [],
};


export type UserProfile = z.infer<typeof UserProfileSchema>;
export type SocialLinks = z.infer<typeof SocialLinksSchema>;
export type SocialLinkItem = z.infer<typeof SocialLinkItemSchema>;
export type SingleSocialLink = z.infer<typeof SingleSocialLinkEnum>;
export type UserProfileSchemaType = typeof UserProfileSchema;
export { UserProfileSchema, UserProfileDefault };