'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import { Category } from '@/types/content/BlogTypes'
import { SafeUser } from '@/types/user/UserTypes'
import FeedCardImage, { FeedCardProps } from './Partials/FeedCardImage'
import { useTranslation } from 'react-i18next'

import dynamic from 'next/dynamic'
import Pagination from '@/components/common/UI/Pagination'

const KnowledgeGraph2DButton = dynamic(() => import('../../Knowledge/KnowledgeGraph2D/Button'), {
  ssr: false,
  loading: () => null,
})

interface FeedProps {
  category?: Pick<Category, 'categoryId' | 'title'>
  author?: Pick<SafeUser, 'userId' | 'name' | 'userProfile'>
}

const PAGE_SIZE = 6

export default function Feed(props: FeedProps) {
  const { category, author } = props
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

  const [feeds, setFeeds] = useState<FeedCardProps[]>([])
  const [total, setTotal] = useState(0)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  useEffect(() => {
    axiosInstance
      .get(
        '/api/posts' +
          `?page=${currentPage - 1}&pageSize=${PAGE_SIZE}&sortDir=desc` +
          (category ? `&categoryId=${category.categoryId}` : '') +
          (author ? `&authorId=${author.userId}` : '')
      )
      .then((response) => {
        setFeeds(
          response.data.posts.map((post: any) => ({
            ...post,
            createdAt: new Date(post.createdAt),
            image: post.image || `/api/posts/${post.postId}/cover.jpeg`,
          }))
        )
        setTotal(response.data.total)
        document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' })
      })
      .catch((error) => {
        console.error('Error fetching posts:', error)
      })
  }, [currentPage])

  return (
    <section className="min-h-screen bg-base-100 pt-32" id="blog">
      <div className="px-4 mx-auto max-w-screen-xl lg:pb-16 lg:px-6 duration-1000">
        <div className="mx-auto text-center lg:mb-8 -mt-8 lg:mt-0">
          <div className="mb-8 hidden sm:flex items-center justify-center space-x-4 text-3xl lg:text-4xl tracking-tight font-extrabold">
            <p>
              {category
                ? category.title
                : author
                  ? `${t('frontend.feed.posts_by')} ${author.userProfile.name}`
                  : t('frontend.feed.latest_posts')}
            </p>
            <KnowledgeGraph2DButton />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-4">
            {feeds.slice(0, 2).map((feed) => (
              <FeedCardImage key={feed.postId} {...feed} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {feeds.slice(2).map((feed) => (
              <FeedCardImage key={feed.postId} {...feed} />
            ))}
          </div>
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
      </div>
    </section>
  )
}
