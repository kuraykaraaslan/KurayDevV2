'use client'
import SingleArticle from './Partials/SingleArticle'
import { PostWithData } from '@/types/content/BlogTypes'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

const RelatedArticles = ({ categoryId }: { categoryId: string }) => {
  const { t } = useTranslation()

  if (!categoryId) {
    return null
  }

  const [articles, _setArticles] = useState<PostWithData[]>([])

  return (
    <section className="bg-base-100 " id="blog">
      <div className="mx-auto lg:pb-16 lg:px-6 duration-1000">
        <div className="mx-auto text-start lg:mb-8 -mt-8 lg:mt-0 ">
          <h4 className="mb-8 hidden sm:block text-3xl lg:text-4xl tracking-tight font-extrabold">
            {t('frontend.feed.related_articles')}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {articles.map((article, index) => {
              return <SingleArticle key={index} {...article} />
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default RelatedArticles
