'use client'
import axiosInstance from '@/libs/axios'
import { useState, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

const AddComment = ({ postId, parentId }: { postId: string; parentId?: string }) => {
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    // Validate
    if (!content || !name || !email) {
      toast.error(t('frontend.comments.fill_all_fields'))
      return
    }

    // check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      toast.error(t('frontend.comments.invalid_email'))
      return
    }

    // Name should be at least 3 characters and max 50 characters
    if (name.length < 3 || name.length > 50) {
      toast.error(t('frontend.comments.name_length_error'))
      return
    }

    // Content should be at least 5 characters
    if (content.length < 5) {
      toast.error(t('frontend.comments.content_length_error'))
      return
    }

    // Submit
    axiosInstance
      .post('/api/comments', {
        postId,
        name,
        email,
        content,
        parentId,
      })
      .then(() => {
        toast.success(t('frontend.comments.posted_successfully'))
        setContent('')
        setName('')
        setEmail('')
      })
      .catch((error) => {
        console.error(error)
        toast.error(t('frontend.comments.error'))
      })
  }

  return (
    <>
      <div className="mb-4">
        <div className="flex flex-col md:flex-row mb-4 md:space-x-4 space-y-4 md:space-y-0">
          <input
            type="text"
            className="w-full text-sm bg-base-100  rounded-lg rounded-t-lg border border-primary h-12 p-4"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('frontend.comments.name_placeholder')}
            required
          />
          <input
            type="email"
            className="w-full text-sm bg-base-100  rounded-lg rounded-t-lg border border-primary h-12 p-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('frontend.comments.email_placeholder')}
            required
          />
        </div>
        <textarea
          id="comment"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full text-sm bg-base-100 rounded-lg rounded-t-lg border border-primary p-4"
          placeholder={t('frontend.comments.comment_placeholder')}
          required
        ></textarea>
      </div>
      <button
        type="submit"
        onClick={handleSubmit}
        className="btn btn-primary w-full md:w-auto h-12 md:h-12 text-sm font-medium text-center"
      >
        {t('frontend.comments.submit_button')}
      </button>
    </>
  )
}

export default AddComment
