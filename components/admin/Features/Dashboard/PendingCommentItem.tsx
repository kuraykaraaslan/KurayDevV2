import { CommentWithData } from '@/types/content/BlogTypes'

export default function PendingCommentItem({ comment }: { comment: CommentWithData }) {
  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-base-content/70">
          {comment.name || comment.email || 'Anonymous'}
        </span>
        <span className="text-xs text-base-content/30">
          {comment.post?.title?.substring(0, 24)}…
        </span>
      </div>
      <p className="text-sm text-base-content/50 truncate">{comment.content}</p>
    </div>
  )
}
