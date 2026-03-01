//import AnalyticsService from "@/services/AnalyticsService";
import { publishScheduledPosts } from './publishScheduledPosts'

export const hourlyJobs: Array<{ name: string; handler: () => Promise<void> }> = [
    { name: 'publishScheduledPosts', handler: publishScheduledPosts },
]
