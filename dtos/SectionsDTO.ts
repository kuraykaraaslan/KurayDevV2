import { z } from 'zod'

// GitHub Section Schema
const GithubContributionSchema = z.object({
  date: z.string().optional(),
  count: z.number().optional(),
  level: z.string().optional(),
})

export const GetGithubContributionsRequestSchema = z.object({})

export const GetGithubContributionsResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.array(GithubContributionSchema).optional(),
})

// GitLab Section Schema
const GitlabContributionSchema = z.object({
  date: z.string().optional(),
  count: z.number().optional(),
  level: z.string().optional(),
})

export const GetGitlabContributionsRequestSchema = z.object({})

export const GetGitlabContributionsResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.array(GitlabContributionSchema).optional(),
})

// Type Exports
export type GetGithubContributionsRequest = z.infer<typeof GetGithubContributionsRequestSchema>
export type GetGithubContributionsResponse = z.infer<typeof GetGithubContributionsResponseSchema>
export type GithubContribution = z.infer<typeof GithubContributionSchema>

export type GetGitlabContributionsRequest = z.infer<typeof GetGitlabContributionsRequestSchema>
export type GetGitlabContributionsResponse = z.infer<typeof GetGitlabContributionsResponseSchema>
export type GitlabContribution = z.infer<typeof GitlabContributionSchema>

// Schema Exports
export const SectionsSchemas = {
  GetGithubContributionsRequestSchema,
  GetGithubContributionsResponseSchema,
  GetGitlabContributionsRequestSchema,
  GetGitlabContributionsResponseSchema,
} as const
