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

const PostPage = () => {
  const { t } = useTranslation()
  const [sharePost, setSharePost] = useState<PostWithData | null>(null)

  const columns: ColumnDef<PostWithData>[] = [
    {
      key: 'image',
      header: 'Image',
      className: 'w-16',
      accessor: (p) => <ImageCell src={p.image} alt={p.title} />,
    },
    { key: 'title', header: 'Title', accessor: (p) => p.title },
    { key: 'slug', header: 'admin.posts.slug', accessor: (p) => p.slug },
    { key: 'status', header: 'admin.posts.status', accessor: (p) => p.status },
    {
      key: 'translations',
      header: 'Translations',
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
      label: 'admin.posts.edit',
      href: (p) => `/admin/posts/${p.postId}`,
      className: 'btn-primary',
    },
    { label: 'admin.posts.view', href: (p) => `/blog/${p.slug}`, className: 'btn-secondary' },
    {
      label: 'Share',
      onClick: (p) => setSharePost(p),
      className: 'btn-ghost btn-sm',
      hidden: (p) => p.status !== 'PUBLISHED',
    },
    {
      label: 'admin.posts.delete',
      onClick: async (p) => {
        if (!confirm(t('admin.posts.confirm_delete'))) return
        await axiosInstance.delete(`/api/posts/${p.postId}`)
      },
      className: 'text-danger',
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
            searchPlaceholder="admin.posts.search_placeholder"
            buttonText="admin.posts.create_post"
            buttonLink="/admin/posts/create"
            showViewToggle
          />
          <TableBody />
          <TableFooter
            showingText="admin.posts.showing"
            previousText="admin.posts.previous"
            nextText="admin.posts.next"
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
