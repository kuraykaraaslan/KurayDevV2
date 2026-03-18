import StatService from '@/services/StatService'
import PostService from '@/services/PostService'
import MailService from '@/services/NotificationService/MailService'
import SubscriptionService from '@/services/SubscriptionService'

jest.mock('@/services/StatService', () => ({
  __esModule: true,
  default: {
    getAllStats: jest.fn(),
  },
}))

jest.mock('@/services/PostService', () => ({
  __esModule: true,
  default: {
    getAllPosts: jest.fn(),
  },
}))

jest.mock('@/services/NotificationService/MailService', () => ({
  __esModule: true,
  default: {
    sendWeeklyDigestEmail: jest.fn(),
    sendWeeklyAdminAnalyticsEmail: jest.fn(),
  },
}))

jest.mock('@/services/SubscriptionService', () => ({
  __esModule: true,
  default: {
    getAllSubscriptions: jest.fn(),
  },
}))

const mockStatService = StatService as jest.Mocked<typeof StatService>
const mockPostService = PostService as jest.Mocked<typeof PostService>
const mockMailService = MailService as jest.Mocked<typeof MailService>
const mockSubscriptionService = SubscriptionService as jest.Mocked<typeof SubscriptionService>

describe('weeklyJobs', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('is an array with 2 items', async () => {
    const { weeklyJobs } = await import('@/services/CronService/timers/weekly')
    expect(Array.isArray(weeklyJobs)).toBe(true)
    expect(weeklyJobs).toHaveLength(2)
  })

  it('has correct names for each job', async () => {
    const { weeklyJobs } = await import('@/services/CronService/timers/weekly')
    expect(weeklyJobs[0].name).toBe('Send Weekly Digest')
    expect(weeklyJobs[1].name).toBe('Admin Weekly Analytics Summary')
  })

  describe('Send Weekly Digest', () => {
    it('returns without calling MailService when posts.length is 0', async () => {
      ;(mockPostService.getAllPosts as jest.Mock).mockResolvedValue({ posts: [], total: 0 })

      const { weeklyJobs } = await import('@/services/CronService/timers/weekly')
      await weeklyJobs[0].handler()

      expect(mockPostService.getAllPosts).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PUBLISHED', page: 0, pageSize: 5 })
      )
      expect(mockMailService.sendWeeklyDigestEmail).not.toHaveBeenCalled()
      expect(mockSubscriptionService.getAllSubscriptions).not.toHaveBeenCalled()
    })

    it('sends emails to all active subscriptions when posts exist', async () => {
      const posts = [
        { id: '1', title: 'Post 1', slug: 'post-1' },
        { id: '2', title: 'Post 2', slug: 'post-2' },
      ]
      const subscriptions = [
        { email: 'user1@example.com', deletedAt: null },
        { email: 'user2@example.com', deletedAt: null },
      ]
      ;(mockPostService.getAllPosts as jest.Mock).mockResolvedValue({ posts, total: 2 })
      ;(mockSubscriptionService.getAllSubscriptions as jest.Mock).mockResolvedValue({ subscriptions, total: 2 })

      const { weeklyJobs } = await import('@/services/CronService/timers/weekly')
      await weeklyJobs[0].handler()

      expect(mockSubscriptionService.getAllSubscriptions).toHaveBeenCalledWith({ includeDeleted: false })
      expect(mockMailService.sendWeeklyDigestEmail).toHaveBeenCalledTimes(2)
      expect(mockMailService.sendWeeklyDigestEmail).toHaveBeenCalledWith('user1@example.com', posts)
      expect(mockMailService.sendWeeklyDigestEmail).toHaveBeenCalledWith('user2@example.com', posts)
    })

    it('skips subscriptions with deletedAt set', async () => {
      const posts = [{ id: '1', title: 'Post 1', slug: 'post-1' }]
      const subscriptions = [
        { email: 'active@example.com', deletedAt: null },
        { email: 'deleted@example.com', deletedAt: new Date() },
      ]
      ;(mockPostService.getAllPosts as jest.Mock).mockResolvedValue({ posts, total: 1 })
      ;(mockSubscriptionService.getAllSubscriptions as jest.Mock).mockResolvedValue({ subscriptions, total: 2 })

      const { weeklyJobs } = await import('@/services/CronService/timers/weekly')
      await weeklyJobs[0].handler()

      expect(mockMailService.sendWeeklyDigestEmail).toHaveBeenCalledTimes(1)
      expect(mockMailService.sendWeeklyDigestEmail).toHaveBeenCalledWith('active@example.com', posts)
      expect(mockMailService.sendWeeklyDigestEmail).not.toHaveBeenCalledWith('deleted@example.com', posts)
    })

    it('passes a date 7 days ago to getAllPosts createdAfter', async () => {
      ;(mockPostService.getAllPosts as jest.Mock).mockResolvedValue({ posts: [], total: 0 })

      const before = new Date()
      before.setDate(before.getDate() - 7)
      before.setHours(0, 0, 0, 0)

      const { weeklyJobs } = await import('@/services/CronService/timers/weekly')
      await weeklyJobs[0].handler()

      const callArgs = (mockPostService.getAllPosts as jest.Mock).mock.calls[0][0]
      const passedDate: Date = callArgs.createdAfter
      expect(passedDate.getTime()).toBeCloseTo(before.getTime(), -3) // within 1 second
    })
  })

  describe('Admin Weekly Analytics Summary', () => {
    it('calls StatService.getAllStats with "weekly" and sends admin analytics email', async () => {
      const statsSummary = { views: 1000, visitors: 500 }
      ;(mockStatService.getAllStats as jest.Mock).mockResolvedValue(statsSummary)
      ;(mockMailService.sendWeeklyAdminAnalyticsEmail as jest.Mock).mockResolvedValue(undefined)

      const { weeklyJobs } = await import('@/services/CronService/timers/weekly')
      await weeklyJobs[1].handler()

      expect(mockStatService.getAllStats).toHaveBeenCalledWith('weekly')
      expect(mockMailService.sendWeeklyAdminAnalyticsEmail).toHaveBeenCalledWith(statsSummary)
    })
  })
})
