'use client'
import axiosInstance from '@/libs/axios'
import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { useGlobalStore } from '@/libs/zustand'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

export default function CallbackPage() {
  const searchParams = useSearchParams()

  const accessToken = searchParams.get('accessToken')
  const refreshToken = searchParams.get('refreshToken')

  const router = useRouter()
  const { setUser } = useGlobalStore()

  useEffect(() => {
    const fetchSession = async () => {
      await axiosInstance
        .get('/api/auth/session')
        .then((res) => {
          if (res.status === 200) {
            setUser(res.data.user)
            toast.success('Logged in successfully.')
          } else {
            toast.error(res.data.error)
          }
        })
        .catch((err) => {
          toast.error(err.response.data.error)
        })
        .finally(() => {
          router.push('/')
        })
    }

    fetchSession()
  }, [accessToken, refreshToken])

  return (
    <div>
      <h1>we are logging you in...</h1>
    </div>
  )
}
