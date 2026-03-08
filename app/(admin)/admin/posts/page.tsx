'use client'
import { useState } from 'react'
import Table, {
  TableProvider,
  TableHeader,
  TableBody,
  TableFooter,
  ImageCell,
  ColumnDef,
  ActionButton,
} from '@/components/admin/UI/Forms/DynamicTable'
import { PostWithData } from '@/types/content/BlogTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import { getLangFlagUrl as findFlagUrlByIso2Code } from '@/types/common/I18nTypes'
import PostShareModal from '@/components/admin/Features/Share/PostShareModal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShareAlt } from '@fortawesome/free-solid-svg-icons'

const PostPage = () => {
  const { t } = useTranslation()
  const [sharePost, setSharePost] = useState<PostWithData | null>(null)

  const columns: ColumnDef<PostWithData>[] = [
    {
      key: 'image',
      header: 'common.image.title',
      className: 'w-16',
      accessor: (p) => <ImageCell src={p.image} alt={p.title} />,
    },
    { key: 'title', header: 'common.title', accessor: (p) => p.title, },
    { key: 'slug', header: 'common.slug', accessor: (p) => p.slug },
    { key: 'status', header: 'common.status', accessor: (p) => p.status },
    {
      key: 'translations',
      header: 'common.translations',
      hideOnMobile: true,
      accessor: (p) =>
        p.translations?.length ? (
          <div className="flex flex-wrap gap-1">
            {p.translations.map((tr) => (
              <img key={tr.lang} src={findFlagUrlByIso2Code(tr.lang)} alt={tr.lang} className="w-3 h-3 rounded-full" />
            ))}
          </div>
        ) : (
          <span className="text-base-content/30 text-xs">—</span>
        ),
    },
  ]

  const actions: ActionButton<PostWithData>[] = [
    {
      label: 'common.edit',
      href: (p) => `/admin/posts/${p.postId}`,
      className: 'btn-primary',
    },
    { label: 'common.view', href: (p) => `/blog/${p.slug}`, className: 'btn-secondary' },
    {
      label: <FontAwesomeIcon icon={faShareAlt} size="sm" />,
      onClick: (p) => setSharePost(p),
      className: 'btn-ghost btn-sm bg-green-500/10 text-green-500 hover:bg-green-500/20',
      hidden: (p) => p.status !== 'PUBLISHED',
    },
    {
      label: 'common.delete',
      onClick: async (p) => {
        if (!confirm(t('common.confirm_delete'))) return
        await axiosInstance.delete(`/api/posts/${p.postId}`)
      },
      className: 'btn-error',
      hideOnMobile: true,
    },
  ]

  return (
    <>
      <TableProvider<PostWithData>
        apiEndpoint="/api/posts"
        dataKey="posts"
        idKey="postId"
        columns={columns}
        actions={actions}
        additionalParams={{ sort: 'desc', status: 'ALL' }}

      >
        <Table>
          <TableHeader
          title="admin.posts.title"
            searchPlaceholder="common.search_placeholder"
            buttons={[{ label: 'common.create', href: '/admin/posts/create' },
              { label: 'common.post_series', href: '/admin/post-series', className: 'btn-secondary' }]}
            showViewToggle
            showColumnToggle
            showRefresh
            showExport
          />
          <TableBody />
          <TableFooter
            showingText="common.showing"
            previousText="common.previous"
            nextText="common.next"
          />
        </Table>
      </TableProvider>

      {sharePost && (
        <PostShareModal post={sharePost} onClose={() => setSharePost(null)} />
      )}
    </>
  )
}

export default PostPage
