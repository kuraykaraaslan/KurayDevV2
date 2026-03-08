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
import { getLangFlagUrl as findFlagUrlByIso2Code } from '@/types/common/I18nTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'

const CategoryPage = () => {
  const { t } = useTranslation()

  const columns: ColumnDef<CategoryWithTranslations>[] = [
    {
      key: 'image',
      header: 'common.image.title',
      className: 'w-16',
      accessor: (c) => <ImageCell src={c.image} alt={c.title} />,
    },
    { key: 'title', header: 'common.title', accessor: (c) => c.title },
    { key: 'slug', header: 'common.slug', accessor: (c) => c.slug },
    {
      key: 'translations',
      header: 'common.translations',
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
      label: 'common.edit',
      href: (c) => `/admin/categories/${c.categoryId}`,
      className: 'btn-secondary',
    },
    { label: 'common.view', href: (c) => `/blog/${c.slug}`, className: 'btn-primary' },
    {
      label: 'common.posts',
      href: (c) => `/admin/posts?categoryId=${c.categoryId}`,
      className: 'btn-warning',
      hideOnMobile: true,
    },
    {
      label: 'common.delete',
      onClick: async (c) => {
        if (!confirm(t('common.confirm_delete'))) return
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
          searchPlaceholder="common.search_placeholder"
          buttons={[{ label: 'common.create', href: '/admin/categories/create' }]}
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

export default CategoryPage
