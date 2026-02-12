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
import { Project } from '@/types/content/ProjectTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'

const ProjectPage = () => {
  const { t } = useTranslation()

  const columns: ColumnDef<Project>[] = [
    {
      key: 'image',
      header: '',
      className: 'w-16',
      accessor: (p) => <ImageCell src={p.image} alt={p.title} />,
    },
    { key: 'title', header: 'admin.projects.project_name', accessor: (p) => p.title },
    {
      key: 'technologies',
      header: 'admin.projects.tech_stack',
      className: 'max-w-20',
      accessor: (p) => p.technologies?.join(', ') || '-',
    },
    { key: 'slug', header: 'admin.projects.slug', className: 'max-w-16', accessor: (p) => p.slug },
    { key: 'status', header: 'admin.projects.status', accessor: (p) => p.status },
  ]

  const actions: ActionButton<Project>[] = [
    {
      label: 'admin.projects.edit',
      href: (p) => `/admin/projects/${p.projectId}`,
      className: 'btn-primary',
    },
    { label: 'admin.projects.view', href: (p) => `/project/${p.slug}`, className: 'btn-secondary' },
    {
      label: 'admin.projects.delete',
      onClick: async (p) => {
        if (!confirm(t('admin.projects.confirm_delete'))) return
        await axiosInstance.delete(`/api/projects/${p.projectId}`)
      },
      className: 'text-white',
      hideOnMobile: true,
    },
  ]

  return (
    <TableProvider<Project>
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
          searchPlaceholder="admin.projects.search_placeholder"
        />
        <TableBody />
        <TableFooter
          showingText="admin.projects.showing"
          previousText="admin.projects.previous"
          nextText="admin.projects.next"
        />
      </Table>
    </TableProvider>
  )
}

export default ProjectPage
