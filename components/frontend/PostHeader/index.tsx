import React from 'react'
import Link from 'next/link'
import { PostWithData } from '@/types/BlogTypes'
import PostLike from './partials/PostLike'

const PostHeader = (post: PostWithData) => {
  const readTime = Math.ceil(post.content.split(' ').length / 200)

  return (
    <div className='max-w-none justify-center text-left mx-auto prose mb-8'>
      <div className='flex items-center'>
        <h1 className='text-3xl font-bold text-left mt-4 mb-4 mr-4'>{post.title}</h1>
        <PostLike postId={post.postId} />
      </div>
      <div className='text-sm flex items-center space-x-2'>
        <span>
          {post.createdAt
            ? new Date(post.createdAt).toLocaleDateString()
            : 'No Date'}
        </span>
        <Link href={'/blog/' + post.category.slug} className='text-primary'>
          {post.category.title}
        </Link>
        <span className='text-primary hidden md:inline'>•</span>
        <span className='hidden md:inline'>{post.views} views</span>
        <span className='text-primary'>•</span>
        <span>{readTime} min read</span>
        <span className='text-primary hidden md:inline'>•</span>
        <span className='hidden md:inline'>
          by{' '}
          <Link href='/' className='text-primary'>
            Kuray Karaaslan
          </Link>
        </span>
      </div>
    </div>
  )
}

export default PostHeader
