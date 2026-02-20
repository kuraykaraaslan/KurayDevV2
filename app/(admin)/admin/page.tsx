'use client'
import { useEffect, useState, useMemo, ReactNode } from 'react'
import axiosInstance from '@/libs/axios'
import { PostWithData, CommentWithData } from '@/types/content/BlogTypes'
import { Stat } from '@/types/common/StatTypes'
import { Subscription } from '@/types/common/SubscriptionTypes'
import { Appointment } from '@/types/features/CalendarTypes'
import { ContactForm } from '@/types/features/ContactTypes'
import { GeoLocation } from '@/dtos/AnalyticsDTO'
import {
  faNewspaper,
  faFolder,
  faUsers,
  faEye,
  faComment,
} from '@fortawesome/free-solid-svg-icons'
import DashboardWidget, { StatsGrid } from '@/components/admin/Features/Dashboard'
import StatCardItem from '@/components/admin/Features/Dashboard/StatCardItem'
import RecentPostItem from '@/components/admin/Features/Dashboard/RecentPostItem'
import PendingCommentItem from '@/components/admin/Features/Dashboard/PendingCommentItem'
import PopularPostItem from '@/components/admin/Features/Dashboard/PopularPostItem'
import SubscriptionItem from '@/components/admin/Features/Dashboard/SubscriptionItem'
import AppointmentItem from '@/components/admin/Features/Dashboard/AppointmentItem'
import ContactFormItem from '@/components/admin/Features/Dashboard/ContactFormItem'
import TrafficOverviewChart, { TrafficDataPoint } from '@/components/admin/Features/Dashboard/TrafficOverviewChart'
import GeoStatsItem from '@/components/admin/Features/Dashboard/GeoStatsItem'

interface DashboardWidgetConfig {
  key: string
  component: ReactNode
}

const statCards = [
  { key: 'totalPosts', label: 'Posts', icon: faNewspaper, href: '/admin/posts' },
  { key: 'totalCategories', label: 'Categories', icon: faFolder, href: '/admin/categories' },
  { key: 'totalUsers', label: 'Users', icon: faUsers, href: '/admin/users' },
  { key: 'totalViews', label: 'Total Views', icon: faEye, href: null },
  { key: 'totalComments', label: 'Comments', icon: faComment, href: '/admin/comments' },
] as const

export default function DashboardPage() {
  const [stats, setStats] = useState<Stat | null>(null)
  const [recentPosts, setRecentPosts] = useState<PostWithData[]>([])
  const [popularPosts, setPopularPosts] = useState<PostWithData[]>([])
  const [pendingComments, setPendingComments] = useState<CommentWithData[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [contactForms, setContactForms] = useState<ContactForm[]>([])
  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>([])
  const [geoData, setGeoData] = useState<GeoLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          statsRes,
          postsRes,
          popularRes,
          commentsRes,
          subscriptionsRes,
          appointmentsRes,
          contactFormsRes,
          geoRes,
        ] = await Promise.allSettled([
          axiosInstance.post('/api/stats', { frequency: 'all-time' }),
          axiosInstance.get('/api/posts?page=0&pageSize=5&status=ALL&sort=desc'),
          axiosInstance.get('/api/posts?page=0&pageSize=5&status=PUBLISHED&sortBy=views'),
          axiosInstance.get('/api/comments?page=0&pageSize=5&pending=true'),
          axiosInstance.get('/api/contact/subscription?page=0&pageSize=5'),
          axiosInstance.get('/api/appointments?page=1&pageSize=5'),
          axiosInstance.get('/api/contact/form?page=0&pageSize=5'),
          axiosInstance.get('/api/analytics/geo'),
        ])

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.values)
        if (postsRes.status === 'fulfilled') setRecentPosts(postsRes.value.data.posts ?? [])
        if (popularRes.status === 'fulfilled') {
          const posts = popularRes.value.data.posts ?? []
          setPopularPosts([...posts].sort((a: PostWithData, b: PostWithData) => (b.views ?? 0) - (a.views ?? 0)))
        }
        if (commentsRes.status === 'fulfilled')
          setPendingComments(commentsRes.value.data.comments ?? [])
        if (subscriptionsRes.status === 'fulfilled')
          setSubscriptions(subscriptionsRes.value.data.subscriptions ?? [])
        if (appointmentsRes.status === 'fulfilled')
          setAppointments(appointmentsRes.value.data.appointments ?? [])
        if (contactFormsRes.status === 'fulfilled')
          setContactForms(contactFormsRes.value.data.contactForms ?? [])
        if (geoRes.status === 'fulfilled') {
          const locations = geoRes.value.data.data ?? []
          // Aggregate by country
          const countryMap = new Map<string, GeoLocation & { visitCount: number }>()
          locations.forEach((loc: GeoLocation) => {
            const key = loc.country || 'Unknown'
            const existing = countryMap.get(key)
            if (existing) {
              existing.visitCount += loc.visitCount ?? 1
            } else {
              countryMap.set(key, { ...loc, visitCount: loc.visitCount ?? 1 })
            }
          })
          setGeoData(Array.from(countryMap.values()).slice(0, 5))

          // Generate traffic data from geo data (last 7 days simulation)
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
          const totalVisits = locations.reduce((sum: number, loc: GeoLocation) => sum + (loc.visitCount ?? 1), 0)
          const avgPerDay = Math.ceil(totalVisits / 7)
          setTrafficData(
            days.map((label) => ({
              label,
              value: Math.floor(avgPerDay * (0.5 + Math.random())),
            }))
          )
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const widgets: DashboardWidgetConfig[] = useMemo(
    () => [
      {
        key: 'recent-posts',
        component: (
          <DashboardWidget
            title="Recent Posts"
            viewAllHref="/admin/posts"
            loading={loading}
            isEmpty={recentPosts.length === 0}
            emptyMessage="No posts yet."
          >
            {recentPosts.map((post) => (
              <RecentPostItem key={post.postId} post={post} />
            ))}
          </DashboardWidget>
        ),
      },
      {
        key: 'pending-comments',
        component: (
          <DashboardWidget
            title="Pending Comments"
            viewAllHref="/admin/comments"
            loading={loading}
            isEmpty={pendingComments.length === 0}
            emptyMessage="No pending comments."
          >
            {pendingComments.map((comment) => (
              <PendingCommentItem key={comment.commentId} comment={comment} />
            ))}
          </DashboardWidget>
        ),
      },
      {
        key: 'popular-posts',
        component: (
          <DashboardWidget
            title="Popular Posts"
            viewAllHref="/admin/posts"
            loading={loading}
            isEmpty={popularPosts.length === 0}
            emptyMessage="No popular posts yet."
          >
            {popularPosts.map((post) => (
              <PopularPostItem key={post.postId} post={post} />
            ))}
          </DashboardWidget>
        ),
      },
      {
        key: 'subscriptions',
        component: (
          <DashboardWidget
            title="New Subscriptions"
            viewAllHref="/admin/subscriptions"
            loading={loading}
            isEmpty={subscriptions.length === 0}
            emptyMessage="No subscriptions yet."
          >
            {subscriptions.map((sub) => (
              <SubscriptionItem key={sub.email} subscription={sub} />
            ))}
          </DashboardWidget>
        ),
      },
      {
        key: 'appointments',
        component: (
          <DashboardWidget
            title="Appointments"
            viewAllHref="/admin/appointments"
            loading={loading}
            isEmpty={appointments.length === 0}
            emptyMessage="No appointments scheduled."
          >
            {appointments.map((apt) => (
              <AppointmentItem key={apt.appointmentId} appointment={apt} />
            ))}
          </DashboardWidget>
        ),
      },
      {
        key: 'contact-forms',
        component: (
          <DashboardWidget
            title="Contact Forms"
            viewAllHref="/admin/contacts"
            loading={loading}
            isEmpty={contactForms.length === 0}
            emptyMessage="No contact forms yet."
          >
            {contactForms.map((contact) => (
              <ContactFormItem key={contact.contactId} contact={contact} />
            ))}
          </DashboardWidget>
        ),
      },
      {
        key: 'traffic-overview',
        component: (
          <DashboardWidget
            title="Traffic Overview"
            viewAllHref="/admin/analytics"
            loading={false}
            isEmpty={false}
            emptyMessage=""
          >
            <TrafficOverviewChart data={trafficData} loading={loading} />
          </DashboardWidget>
        ),
      },
      {
        key: 'geo-stats',
        component: (
          <DashboardWidget
            title="Geographic Stats"
            viewAllHref="/admin/analytics"
            loading={loading}
            isEmpty={geoData.length === 0}
            emptyMessage="No geographic data available."
          >
            {geoData.map((loc, idx) => (
              <GeoStatsItem key={loc.id || idx} location={loc} />
            ))}
          </DashboardWidget>
        ),
      },
    ],
    [recentPosts, pendingComments, popularPosts, subscriptions, appointments, contactForms, trafficData, geoData, loading]
  )

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-base-content">Dashboard</h1>
        <p className="text-base-content/50 text-sm mt-1">Overview of your content and activity</p>
      </div>

      <StatsGrid>
        {statCards.map(({ key, label, icon, href }) => (
          <StatCardItem
            key={key}
            label={label}
            value={stats ? stats[key] : null}
            icon={icon}
            href={href}
            loading={loading}
          />
        ))}
      </StatsGrid>

      <div className="grid md:grid-cols-2 gap-6">
        {widgets.map((widget) => (
          <div key={widget.key}>{widget.component}</div>
        ))}
      </div>
    </div>
  )
}
