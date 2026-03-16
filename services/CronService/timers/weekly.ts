import StatService from '@/services/StatService'
import PostService from '@/services/PostService'
import MailService from '@/services/NotificationService/MailService'
import SubscriptionService from '@/services/SubscriptionService'

export const weeklyJobs = [
  {
    name: 'Send Weekly Digest',
    handler: async () => {
      const thisWeekStart = new Date()
      thisWeekStart.setDate(thisWeekStart.getDate() - 7) // Last 7 days
      thisWeekStart.setHours(0, 0, 0, 0)

      const { posts } = await PostService.getAllPosts({
        createdAfter: thisWeekStart,
        status: 'PUBLISHED',
        page: 0,
        pageSize: 5,
      })

      if (posts.length === 0) {
        return
      }

      const {subscriptions} = await SubscriptionService.getAllSubscriptions({ includeDeleted: false })

      for (const subscription of subscriptions) {
        if (!subscription.deletedAt) {
          MailService.sendWeeklyDigestEmail(subscription.email, posts)
        }
      }
    },
  },
  {
    name: 'Admin Weekly Analytics Summary',
    handler: async () => {
      const statsSummary = await StatService.getAllStats('weekly')
      await MailService.sendWeeklyAdminAnalyticsEmail(statsSummary)
    },
  },
]
