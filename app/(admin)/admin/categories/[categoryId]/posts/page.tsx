'use client'

import { useEffect, useState } from 'react'
import PostTable from '@/components/admin/UI/Tables/PostTable'
import { notFound, useParams } from 'next/navigation'
import axiosInstance from '@/libs/axios'

const Page = () => {
  const { categoryId } = useParams()
  const [category, setCategory] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategory = async () => {
  
      await axiosInstance.get(`/api/categories/${categoryId}`).then((res => {
        setCategory(res.data.category)
        setLoading(false)
      })).catch((error) => {
        console.error(error)
        setLoading(false)
        if (error.response && error.response.status === 404) {
          notFound()
        }
      })  
    }

    fetchCategory()
  }, [categoryId])

  if (loading) return <p>Loading...</p>
  if (!category) return null

  return <PostTable category={category} />
}

export default Page
