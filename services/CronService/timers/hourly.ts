//import AnalyticsService from "@/services/AnalyticsService";
import { publishScheduledPosts } from '../jobs/publishScheduledPosts'

export const hourlyJobs: Array<{ name: string; handler: () => Promise<void> }> = [
    { name: 'publishScheduledPosts', handler: publishScheduledPosts },
]
