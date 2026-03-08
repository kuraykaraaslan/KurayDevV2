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
import { ProjectWithTranslations } from '@/types/content/ProjectTypes'
import { getLangFlagUrl as findFlagUrlByIso2Code } from '@/types/common/I18nTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'

const ProjectPage = () => {
  const { t } = useTranslation()

  const columns: ColumnDef<ProjectWithTranslations>[] = [
    {
      key: 'image',
      header: '',
      className: 'w-16',
      accessor: (p) => <ImageCell src={p.image} alt={p.title} />,
    },
    { key: 'title', header: 'common.title', accessor: (p) => p.title },
    {
      key: 'technologies',
      header: 'admin.projects.tech_stack',
      className: 'max-w-20',
      accessor: (p) => p.technologies?.join(', ') || '-',
    },
    { key: 'slug', header: 'common.slug', className: 'max-w-16', accessor: (p) => p.slug },
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

  const actions: ActionButton<ProjectWithTranslations>[] = [
    {
      label: 'common.edit',
      href: (p) => `/admin/projects/${p.projectId}`,
      className: 'btn-primary',
    },
    { label: 'common.view', href: (p) => `/project/${p.slug}`, className: 'btn-secondary' },
    {
      label: 'common.delete',
      onClick: async (p) => {
        if (!confirm(t('common.confirm_delete'))) return
        await axiosInstance.delete(`/api/projects/${p.projectId}`)
      },
      className: 'text-white',
      hideOnMobile: true,
    },
  ]

  return (
    <TableProvider<ProjectWithTranslations>
      apiEndpoint="/api/projects"
      dataKey="projects"
      idKey="projectId"
      columns={columns}
      actions={actions}
      additionalParams={{ sort: 'desc' }}
    >
      <Table>
        <TableHeader
          title="admin.projects.title"
          searchPlaceholder="common.search_placeholder"
          buttons={[{ label: 'common.create', href: '/admin/projects/create' }]}
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

export default ProjectPage
