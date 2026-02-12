'use client'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons'
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons'
import axiosInstance from '@/libs/axios'

export default function LikeButton({ postId }: { postId: string }) {
  const [isLiked, setIsLiked] = useState(false)

  const toggleLike = async () => {
    setIsLiked(!isLiked)
    // API call can be made here
    try {
      if (isLiked) {
        // If already liked, remove the like
        await axiosInstance.delete(`/api/posts/${postId}/like`).catch(() => {
          setIsLiked(true) // Revert on error
        })
      } else {
        // If not liked, add like
        await axiosInstance.post(`/api/posts/${postId}/like`).catch(() => {
          setIsLiked(false) // Revert on error
        })
      }
    } catch (error) {
      console.error('Like toggle error:', error)
      setIsLiked(!isLiked) // Revert to previous state on error
    }
  }

  // You might want to fetch the current like status from API when like state changes

  return (
    <button onClick={toggleLike} className="flex items-center">
      <FontAwesomeIcon
        icon={isLiked ? faHeartSolid : faHeartRegular}
        className={`text-2xl ${isLiked ? 'text-red-500' : 'text-gray-400'}`}
      />
    </button>
  )
}
