import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye } from '@fortawesome/free-solid-svg-icons'
import { PostWithData } from '@/types/content/BlogTypes'

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function PopularPostItem({ post }: { post: PostWithData }) {
  return (
    <Link
      href={`/admin/posts/${post.postId}`}
      className="flex items-center gap-3 px-5 py-3 hover:bg-base-content/5 transition-colors"
    >
      <span className="text-sm text-base-content/80 truncate flex-1">{post.title}</span>
      <span className="text-xs flex-shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary">
        <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
        {formatViews(post.views ?? 0)}
      </span>
    </Link>
  )
}
