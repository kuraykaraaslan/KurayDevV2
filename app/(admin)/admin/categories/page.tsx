'use client'
import Table, {
  TableProvider,
  TableHeader,
  TableBody,
  TableFooter,
  ImageCell,
  ColumnDef,
  ActionButton,
} from '@/components/admin/UI/Forms/DynamicTable'
import { CategoryWithTranslations } from '@/types/content/BlogTypes'
import { findFlagUrlByIso2Code } from '@/helpers/Language'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'

const CategoryPage = () => {
  const { t } = useTranslation()

  const columns: ColumnDef<CategoryWithTranslations>[] = [
    {
      key: 'image',
      header: 'admin.categories.image',
      className: 'w-16',
      accessor: (c) => <ImageCell src={c.image} alt={c.title} />,
    },
    { key: 'title', header: 'Title', accessor: (c) => c.title },
    { key: 'slug', header: 'admin.categories.slug', accessor: (c) => c.slug },
    {
      key: 'translations',
      header: 'Translations',
      hideOnMobile: true,
      accessor: (c) =>
        c.translations?.length ? (
          <div className="flex flex-wrap gap-1">
            {c.translations.map((tr) => (
              <img key={tr.lang} src={findFlagUrlByIso2Code(tr.lang)} alt={tr.lang} className="w-3 h-3 rounded-full" />
            ))}
          </div>
        ) : (
          <span className="text-base-content/30 text-xs">—</span>
        ),
    },
  ]

  const actions: ActionButton<CategoryWithTranslations>[] = [
    {
      label: 'admin.categories.edit',
      href: (c) => `/admin/categories/${c.categoryId}`,
      className: 'btn-secondary',
    },
    { label: 'admin.categories.view', href: (c) => `/blog/${c.slug}`, className: 'btn-primary' },
    {
      label: 'admin.categories.posts',
      href: (c) => `/admin/categories/${c.categoryId}/posts`,
      className: 'btn-warning',
      hideOnMobile: true,
    },
    {
      label: 'admin.categories.delete',
      onClick: async (c) => {
        if (!confirm(t('admin.categories.confirm_delete'))) return
        await axiosInstance.delete(`/api/categories/${c.categoryId}`)
      },
      className: 'btn-secondary',
      hideOnMobile: true,
    },
  ]

  return (
    <TableProvider<CategoryWithTranslations>
      apiEndpoint="/api/categories"
      dataKey="categories"
      idKey="categoryId"
      columns={columns}
      actions={actions}
    >
      <Table>
        <TableHeader
          title="admin.categories.title"
          searchPlaceholder="admin.categories.search_placeholder"
          buttonText="admin.categories.create_category"
          buttonLink="/admin/categories/create"
        />
        <TableBody />
        <TableFooter
          showingText="admin.categories.showing"
          previousText="admin.categories.previous"
          nextText="admin.categories.next"
        />
      </Table>
    </TableProvider>
  )
}

export default CategoryPage
