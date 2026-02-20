import { z } from 'zod'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faNewspaper, faFolder, faUsers, faEye, faComment } from '@fortawesome/free-solid-svg-icons'
import { GeoLocation } from '@/dtos/AnalyticsDTO'
import { TrafficDataPoint } from '@/components/admin/Features/Dashboard/TrafficOverviewChart'

export type { TrafficDataPoint }

// Schemas
export const StatCardSchema = z.object({
  key: z.enum(['totalViews', 'totalPosts', 'totalComments', 'totalUsers', 'totalCategories']),
  label: z.string(),
  icon: z.custom<IconDefinition>(),
  href: z.string().nullable(),
})

export const StatFrequencyOptionSchema = z.object({
  label: z.string(),
  value: z.enum(['all-time', 'monthly', 'weekly', 'daily', 'hourly']),
})

// Types
export type StatCard = z.infer<typeof StatCardSchema>
export type StatFrequencyOption = z.infer<typeof StatFrequencyOptionSchema>

// Constants
export const STAT_CARDS: StatCard[] = [
  { key: 'totalViews', label: 'Total Views', icon: faEye, href: null },
  { key: 'totalPosts', label: 'Posts', icon: faNewspaper, href: '/admin/posts' },
  { key: 'totalComments', label: 'Comments', icon: faComment, href: '/admin/comments' },
  { key: 'totalUsers', label: 'Users', icon: faUsers, href: '/admin/users' },
  { key: 'totalCategories', label: 'Categories', icon: faFolder, href: '/admin/categories' },
]

export const STAT_FREQUENCIES: StatFrequencyOption[] = [
  { label: 'All Time', value: 'all-time' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Hourly', value: 'hourly' },
]

// Utilities
export function aggregateGeoByCountry(
  locations: GeoLocation[]
): (GeoLocation & { visitCount: number })[] {
  const countryMap = new Map<string, GeoLocation & { visitCount: number }>()
  locations.forEach((loc) => {
    const key = loc.country || 'Unknown'
    const existing = countryMap.get(key)
    if (existing) {
      existing.visitCount += loc.visitCount ?? 1
    } else {
      countryMap.set(key, { ...loc, visitCount: loc.visitCount ?? 1 })
    }
  })
  return Array.from(countryMap.values()).sort((a, b) => b.visitCount - a.visitCount)
}

export function generateTrafficData(locations: GeoLocation[]): TrafficDataPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const totalVisits = locations.reduce((sum, loc) => sum + (loc.visitCount ?? 1), 0)
  const avgPerDay = Math.ceil(totalVisits / 7)
  return days.map((label) => ({
    label,
    value: Math.floor(avgPerDay * (0.5 + Math.random())),
  }))
}
