'use client'

import React, { useEffect, useState } from 'react'
import CategoryService from '@/services/CategoryService'
import PostTable from '@/components/admin/Tables/PostTable'
import { notFound, useParams } from 'next/navigation'

const Page = () => {
  const { categoryId } = useParams()
  const [category, setCategory] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const data = await CategoryService.getCategoryById(categoryId as string)
        if (!data) {
          notFound()
          return
        }
        setCategory(data)
      } catch (error) {
        console.error('Failed to fetch category:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategory()
  }, [categoryId])

  if (loading) return <p>Loading...</p>
  if (!category) return null

  return <PostTable category={category} />
}

export default Page
