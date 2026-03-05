'use client'
import { faCaretLeft, faCaretRight, faBrain, faLayerGroup } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState, ReactNode, useRef, useEffect, useCallback } from 'react'
import PostCard from './Partials/PostCard'
import axiosInstance from '@/libs/axios'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'

interface SimilarPost {
  id: string
  score: number
  title: string
  slug: string
  categorySlug: string
  image?: string
}

interface OtherPostsProps {
  postId?: string
}

const OtherPosts = ({ postId }: OtherPostsProps) => {
  const { t } = useTranslation()
  const { categoryId } = useParams()
  const [children, setChildren] = useState<ReactNode[]>([])
  const [source, setSource] = useState<'ai' | 'category'>('category')
  const [loading, setLoading] = useState(true)

  const sliderRef = useRef<HTMLDivElement>(null)

  /** Fetch AI-similar posts from Knowledge Graph */
  const fetchSimilarPosts = useCallback(async (): Promise<boolean> => {
    if (!postId) return false

    try {
      const res = await axiosInstance.get(`/api/posts/${postId}/similar?limit=10`)
      const similarPosts: SimilarPost[] = res.data.posts

      if (!similarPosts || similarPosts.length < 2) return false

      // Fetch full post data for each similar post
      const fullPostPromises = similarPosts.map((sp) =>
        axiosInstance
          .get(`/api/posts?postId=${sp.id}&pageSize=1`)
          .then((r) => {
            const post = r.data.posts?.[0]
            if (post) {
              post.image = post.image || `/api/posts/${post.postId}/cover.jpeg`
              post._similarityScore = sp.score
            }
            return post
          })
          .catch(() => null)
      )

      const fullPosts = (await Promise.all(fullPostPromises)).filter(Boolean)

      if (fullPosts.length < 2) return false

      const postCards = fullPosts.map((post: any) => (
        <PostCard key={post.postId} post={post} similarityScore={post._similarityScore} />
      ))

      setChildren(postCards)
      setSource('ai')
      return true
    } catch {
      return false
    }
  }, [postId])

  /** Fallback: fetch posts from the same category */
  const fetchCategoryPosts = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/posts?categoryId=${categoryId}&pageSize=10`)
      const posts = res.data.posts
      let postCards = posts.map((post: any) => {
        post.image = post.image || `/api/posts/${post.postId}/cover.jpeg`
        return <PostCard key={post.postId} post={post} />
      })

      if (postCards && postCards.length !== 0) {
        while (postCards.length < 10) {
          postCards = postCards.concat(postCards)
        }
        setChildren(postCards)
        return
      }
      setChildren(postCards)
    } catch (error) {
      console.error(error)
    }
  }, [categoryId])

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true)

      // Try AI-similar first, fallback to category
      const aiSuccess = await fetchSimilarPosts()

      if (!aiSuccess) {
        setSource('category')
        await fetchCategoryPosts()
      }

      setLoading(false)
    }

    loadPosts()
  }, [fetchSimilarPosts, fetchCategoryPosts])

  const handleRight = useCallback(() => {
    if (sliderRef.current) {
      const slider = sliderRef.current
      const scrollAmount = slider.scrollLeft
      if (!children || children.length === 0) {
        return
      }
      const slideWidth = slider.scrollWidth / children?.length
      const slideCount = Math.round(scrollAmount / slideWidth)
      const nextSlide = slideCount + 1
      const nextScroll = nextSlide * slideWidth
      slider.scrollTo({
        left: nextScroll,
        behavior: 'smooth',
      })
    }
  }, [children])

  const handleLeft = useCallback(() => {
    if (sliderRef.current) {
      const slider = sliderRef.current
      const scrollAmount = slider.scrollLeft
      if (!children || children.length === 0) {
        return
      }
      const slideWidth = slider.scrollWidth / children?.length
      const slideCount = Math.round(scrollAmount / slideWidth)
      const nextSlide = slideCount - 1
      const nextScroll = nextSlide * slideWidth
      slider.scrollTo({
        left: nextScroll,
        behavior: 'smooth',
      })
    }
  }, [children])

  if (!loading && (!children || children.length === 0)) {
    return null
  }

  return (
    <div className="container mb-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 mt-4 mb-4">
          <h2 className="text-3xl font-bold text-start">
            {source === 'ai'
              ? t('frontend.feed.smart_recommendations')
              : t('frontend.feed.related_articles')}
          </h2>
          {source === 'ai' && (
            <span className="badge badge-primary badge-sm gap-1 animate-pulse">
              <FontAwesomeIcon icon={faBrain} className="w-3 h-3" />
              AI
            </span>
          )}
          {source === 'category' && (
            <span className="badge badge-ghost badge-sm gap-1">
              <FontAwesomeIcon icon={faLayerGroup} className="w-3 h-3" />
              {t('frontend.feed.same_category')}
            </span>
          )}
        </div>
        <div
          className="flex items-center transition-all duration-300 ease-in-out scroll-smooth"
          style={{ width: 'fit-content' }}
        >
          <button className="me-2" onClick={handleLeft} aria-label={t('frontend.feed.scroll_left')}>
            <FontAwesomeIcon icon={faCaretLeft} style={{ height: '1rem', width: '1rem' }} />
          </button>
          <button onClick={handleRight} aria-label={t('frontend.feed.scroll_right')}>
            <FontAwesomeIcon icon={faCaretRight} style={{ height: '1rem', width: '1rem' }} />
          </button>
        </div>
      </div>

      {source === 'ai' && (
        <p className="text-sm text-base-content/50 mb-3 -mt-2">
          {t('frontend.feed.smart_recommendations_description')}
        </p>
      )}

      {loading ? (
        <div className="max-h-[400px] w-full grid grid-flow-col gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton min-w-[296px] h-[280px] rounded-lg"
            />
          ))}
        </div>
      ) : (
        <div
          className="max-h-[400px] w-full grid grid-flow-col gap-0 overflow-hidden"
          ref={sliderRef}
        >
          {children?.map((child, index) => (
            <div
              id={`slide${index + 1}`}
              className="carousel-item relative mr-4 max-w-[300px]"
              key={index}
            >
              {child}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OtherPosts
