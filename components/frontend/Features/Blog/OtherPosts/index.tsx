'use client'
import { faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState, ReactNode, useRef, useEffect, useCallback } from 'react'
import PostCard from './Partials/PostCard'
import axiosInstance from '@/libs/axios'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'

const OtherPosts = () => {
  const { t } = useTranslation()
  const { categoryId } = useParams()
  const [children, setChildren] = useState<ReactNode[]>([])

  const sliderRef = useRef<HTMLDivElement>(null)

  const fetchPosts = useCallback(async () => {
    await axiosInstance
      .get(`/api/posts?categoryId=${categoryId}&pageSize=10`)
      .then((res) => {
        const posts = res.data.posts
        let postCards = posts.map((post: any) => {
          post.image = post.image || `/api/posts/${post.postId}/cover.jpeg`

          return <PostCard key={post.postId} post={post} />
        })

        if (postCards && postCards.length !== 0) {
          while (postCards.length < 10) {
            postCards = postCards.concat(postCards)
          }
          //Add 3 times the same posts to the end of the array to make the slider infinite
          setChildren(postCards)
          return
        }
        setChildren(postCards)
      })
      .catch((error) => {
        console.error(error)
      })
  }, [categoryId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])
  //create a timer to scroll the slider smoothly

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

  if (!children || children.length === 0) {
    return null
  }

  return (
    <div className="container mb-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-left mt-4 mb-4">{t('frontend.feed.related_articles')}</h2>
        <div
          className="flex items-center transition-all duration-300 ease-in-out scroll-smooth	"
          style={{ width: 'fit-content' }}
        >
          <button className="mr-2" onClick={handleLeft}>
            <FontAwesomeIcon icon={faCaretLeft} style={{ height: '1rem', width: '1rem' }} />
          </button>
          <button onClick={handleRight}>
            <FontAwesomeIcon icon={faCaretRight} style={{ height: '1rem', width: '1rem' }} />
          </button>
        </div>
      </div>
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
    </div>
  )
}

export default OtherPosts
