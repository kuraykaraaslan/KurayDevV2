import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faCircleDot } from '@fortawesome/free-solid-svg-icons'
import { PostWithData } from '@/types/content/BlogTypes'

export default function RecentPostItem({ post }: { post: PostWithData }) {
  return (
    <Link
      href={`/admin/posts/${post.postId}`}
      className="flex items-center gap-3 px-5 py-3 hover:bg-base-content/5 transition-colors"
    >
      <FontAwesomeIcon
        icon={post.status === 'PUBLISHED' ? faCircleCheck : faCircleDot}
        className={`w-3 h-3 flex-shrink-0 ${
          post.status === 'PUBLISHED' ? 'text-success' : 'text-base-content/30'
        }`}
      />
      <span className="text-sm text-base-content/80 truncate flex-1">{post.title}</span>
      <span className="text-xs flex-shrink-0 px-2 py-0.5 rounded bg-base-content/5 text-base-content/40">
        {post.category?.title}
      </span>
    </Link>
  )
}
