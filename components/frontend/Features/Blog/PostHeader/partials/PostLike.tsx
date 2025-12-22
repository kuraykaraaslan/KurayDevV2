'use client'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons'
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons'
import axiosInstance from '@/libs/axios'

export default function LikeButton ({ postId }: { postId: string }) {
  const [isLiked, setIsLiked] = useState(false)

  const toggleLike = async () => {
    setIsLiked(!isLiked)
    // Burada API çağrısı yapılabilir
    try {
      if (isLiked) {
        // Eğer zaten beğenildiyse, beğeniyi kaldır
        await axiosInstance
          .delete(`/api/posts/${postId}/like`)
          .then(response => {
            console.log('Like removed:', response.data)
          })
          .catch(error => {
            console.error('Error removing like:', error)
            setIsLiked(true) // Hata durumunda beğeni durumunu geri al
          })
      } else {
        // Eğer beğenilmediyse, beğeni ekle
        await axiosInstance
          .post(`/api/posts/${postId}/like`)
          .then(response => {
            console.log('Like added:', response.data)
          })
          .catch(error => {
            console.error('Error adding like:', error)
            setIsLiked(false) // Hata durumunda beğeni durumunu geri al
          })
      }
    } catch (error) {
      console.error('Like toggle error:', error)
      setIsLiked(!isLiked) // Hata durumunda eski duruma geri dön
    }
  }

  // Beğeni durumu değiştiğinde, API'den güncel beğeni durumunu çekmek isteyebilirsiniz

  return (
    <button onClick={toggleLike} className='flex items-center'>
      <FontAwesomeIcon
        icon={isLiked ? faHeartSolid : faHeartRegular}
        className={`text-2xl ${isLiked ? 'text-red-500' : 'text-gray-400'}`}
      />
    </button>
  )
}
