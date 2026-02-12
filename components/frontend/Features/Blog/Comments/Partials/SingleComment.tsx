'use client'
import { Comment } from '@/types/content/BlogTypes'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsis, faMessage } from '@fortawesome/free-solid-svg-icons'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'

const SingleComment = ({ comment, gravatarUrl }: { comment: Comment; gravatarUrl: string }) => {
  const { t } = useTranslation()

  const { content, createdAt, parentId, name } = comment

  const handleReply = () => {}

  const handleDelete = async () => {
    await axiosInstance
      .delete(`/api/comments`, {
        data: {
          commentId: comment.commentId,
        },
      })
      .catch((error) => {
        console.error(error)
      })
  }

  return (
    <>
      <div className={'p-6 text-base rounded-lg ' + (parentId ? 'bg-base-200' : 'bg-base-300')}>
        <footer className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <p className="inline-flex items-center mr-3 text-sm font-semibold">
              <img
                className="mr-2 w-6 h-6 rounded-full"
                src={gravatarUrl}
                alt={name || t('frontend.comments.anonymous')}
              />
              {name || t('frontend.comments.anonymous')}
            </p>
            <p className="text-sm">
              {new Date(createdAt).toLocaleDateString()} {new Date(createdAt).toLocaleTimeString()}
            </p>
          </div>
          {true && (
            <details className="dropdown dropdown-end">
              <summary className="btn btn-primary m-1">
                <FontAwesomeIcon icon={faEllipsis} className="w-4 h-4" />
              </summary>
              <ul className="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                <li>
                  <button onClick={handleReply}>{t('frontend.comments.reply')}</button>
                </li>
                <li>
                  <button onClick={handleDelete}>{t('frontend.comments.delete')}</button>
                </li>
              </ul>
            </details>
          )}
        </footer>
        <p className="pt-4 pb-4">{content}</p>

        <div className="flex items-center mt-4 space-x-4 hidden">
          <button type="button" className="flex items-center text-sm font-medium">
            <FontAwesomeIcon icon={faMessage} className="w-4 h-4" />
            <span className="ml-1">{t('frontend.comments.reply')}</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default SingleComment
