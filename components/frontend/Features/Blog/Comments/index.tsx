'use client'
import { useState, useEffect } from 'react'
import SingleComment from './Partials/SingleComment'
import { Comment } from '@/types/content/BlogTypes'
import AddComment from './Partials/AddComment'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import MD5 from 'crypto-js/md5'

const Comments = ({ postId }: { postId: string }) => {
  const { t } = useTranslation()

  const [comments, setComments] = useState<Comment[]>([])
  const [page, _setPage] = useState(0)
  const [pageSize, _setPageSize] = useState(10)

  const fetchComments = async (isAppend = false) => {
    // Fetch comments for the post
    await axiosInstance
      .get(`/api/comments?postId=${postId}&page=${page}&pageSize=${pageSize}`)
      .then((response) => {
        if (isAppend) {
          setComments((prevComments) => {
            const existingIds = new Set(prevComments.map((c) => c.commentId))
            const newComments = response.data.comments.filter(
              (c: Comment) => !existingIds.has(c.commentId)
            )
            return [...prevComments, ...newComments]
          })
        } else {
          setComments(response.data.comments)
        }
      })
      .catch((error) => {
        console.error(error)
      })
  }

  useEffect(() => {
    setComments([])
    fetchComments(false)
  }, [postId])

  useEffect(() => {
    if (page > 0) {
      fetchComments(true)
    }
  }, [page, pageSize])

  return (
    <section className="antialiased">
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-left mt-4 mb-4">
            {t('frontend.comments.comments_count')} ({comments.length})
          </h2>
        </div>
        <div className="mb-6">
          <AddComment postId={postId} />
        </div>

        {comments.map((comment) => {
          const hash = MD5(comment.email || '').toString()
          const gravatarUrl = `https://www.gravatar.com/avatar/${hash}`
          comment.email = null
          return (
            <SingleComment key={comment.commentId} comment={comment} gravatarUrl={gravatarUrl} />
          )
        })}
      </div>
    </section>
  )
}

export default Comments
