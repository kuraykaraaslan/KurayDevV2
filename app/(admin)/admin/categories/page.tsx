'use client'
import Table, {
  TableProvider,
  TableHeader,
  TableBody,
  TableFooter,
  ImageCell,
  ColumnDef,
  ActionButton,
} from '@/components/common/Forms/DynamicTable'
import { CategoryWithTranslations } from '@/types/content/BlogTypes'
import { getLangFlagUrl as findFlagUrlByIso2Code } from '@/types/common/I18nTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencil, faEye, faTrash, faNewspaper } from '@fortawesome/free-solid-svg-icons'

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
      label: <FontAwesomeIcon icon={faPencil} size="sm" />,
      href: (c) => `/admin/categories/${c.categoryId}`,
      className: 'btn-primary',
      tooltip: t('common.edit'),
    },
    {
      label: <FontAwesomeIcon icon={faEye} size="sm" />,
      href: (c) => `/blog/${c.slug}`,
      className: 'btn-secondary',
      tooltip: t('common.view'),
    },
    {
      label: <FontAwesomeIcon icon={faNewspaper} size="sm" />,
      href: (c) => `/admin/posts?categoryId=${c.categoryId}`,
      className: 'btn-warning',
      hideOnMobile: true,
      tooltip: t('common.posts'),
    },
    {
      label: <FontAwesomeIcon icon={faTrash} size="sm" />,
      onClick: async (c) => {
        if (!confirm(t('common.confirm_delete'))) return
        await axiosInstance.delete(`/api/categories/${c.categoryId}`)
      },
      className: 'btn-error',
      hideOnMobile: true,
      tooltip: t('common.delete'),
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
  )
}

export default CategoryPage
