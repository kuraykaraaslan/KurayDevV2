'use client'
import Table, {
  TableProvider,
  TableHeader,
  TableBody,
  TableFooter,
  ColumnDef,
  ActionButton,
} from '@/components/admin/UI/Forms/DynamicTable'
import { CommentWithData } from '@/types/content/BlogTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'

const CommentPage = () => {
  const { t } = useTranslation()

  const columns: ColumnDef<CommentWithData>[] = [
    {
      key: 'post',
      header: 'admin.comments.post',
      className: 'max-w-20',
      accessor: (c) => c.post?.title || '-',
    },
    {
      key: 'contact',
      header: 'admin.comments.contact',
      accessor: (c) => (
        <div className="flex flex-col gap-1">
          <span>{c.email}</span>
          <span className="text-xs opacity-70">{c.name}</span>
        </div>
      ),
    },
    {
      key: 'content',
      header: 'admin.comments.content',
      className: 'max-w-32',
      accessor: (c) => c.content?.substring(0, 50) + '...',
    },
    { key: 'status', header: 'common.status', accessor: (c) => c.status },
  ]

  const actions: ActionButton<CommentWithData>[] = [
    {
      label: 'common.approve',
      onClick: async (c) => {
        if (!confirm(t('admin.comments.confirm_approve'))) return
        await axiosInstance.put('/api/comments', { commentId: c.commentId, status: 'PUBLISHED' })
      },
      className: 'btn-success',
    },
    {
      label: 'common.reject',
      onClick: async (c) => {
        if (!confirm(t('admin.comments.confirm_reject'))) return
        await axiosInstance.put('/api/comments', {
          commentId: c.commentId,
          status: 'NOT_PUBLISHED',
        })
      },
      className: 'btn-warning',
      hideOnMobile: true,
    },
    {
      label: 'common.delete',
      onClick: async (c) => {
        if (!confirm(t('common.confirm_delete'))) return
        await axiosInstance.delete(`/api/comments/${c.commentId}`)
      },
      className: 'btn-error',
      hideOnMobile: true,
    },
  ]

  return (
    <TableProvider<CommentWithData>
      apiEndpoint="/api/comments"
      dataKey="comments"
      idKey="commentId"
      columns={columns}
      actions={actions}
      additionalParams={{ sort: 'desc', pending: 'true' }}
    >
      <Table>
        <TableHeader
          title="admin.comments.title"
          searchPlaceholder="common.search_placeholder"
        />
        <TableBody />
        <TableFooter
          showingText="common.showing"
          previousText="common.previous"
          nextText="common.next"
        />
      </Table>
    </TableProvider>
  )
}

export default CommentPage
