import { z } from 'zod'

const ContributionDay = z.object({
  color: z.string(),
  contributionCount: z.number(),
  date: z.string(),
  weekday: z.number(),
})

const Week = z.object({
  contributionDays: z.array(ContributionDay),
  firstDay: z.string(),
  isMilitaryTime: z.boolean().optional(),
})

const Weeks = z.array(Week)

const GraphQLRes = z.object({
  user: z.object({
    contributionsCollection: z.object({
      contributionCalendar: z.object({
        weeks: Weeks,
      }),
    }),
  }),
})

export type ContributionDay = z.infer<typeof ContributionDay>
export type Week = z.infer<typeof Week>
export type Weeks = z.infer<typeof Weeks>
export type GraphQLRes = z.infer<typeof GraphQLRes>

export type { ContributionDay, Week, Weeks, GraphQLRes }
