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
import { Testimonial } from '@/types/ui/TestimonialTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons'

const TestimonialsPage = () => {
  const { t } = useTranslation()

  const columns: ColumnDef<Testimonial>[] = [
    {
      key: 'image',
      header: 'common.image.title',
      className: 'w-16',
      accessor: (item) => <ImageCell src={item.image} alt={item.name} />,
    },
    { key: 'name', header: 'common.name', accessor: (item) => item.name },
    { key: 'title', header: 'common.title', accessor: (item) => item.title },
    {
      key: 'review',
      header: 'Review',
      hideOnMobile: true,
      accessor: (item) => (
        <span className="line-clamp-2 text-sm text-base-content/70 max-w-xs">{item.review}</span>
      ),
    },
    { key: 'status', header: 'common.status', accessor: (item) => item.status },
  ]

  const actions: ActionButton<Testimonial>[] = [
    {
      label: <FontAwesomeIcon icon={faPencil} size="sm" />,
      href: (item) => `/admin/testimonials/${item.testimonialId}`,
      className: 'btn-secondary',
      tooltip: t('common.edit'),
    },
    {
      label: <FontAwesomeIcon icon={faTrash} size="sm" />,
      onClick: async (item) => {
        if (!confirm(t('common.confirm_delete'))) return
        await axiosInstance.delete(`/api/testimonials/${item.testimonialId}`)
      },
      className: 'btn-error',
      hideOnMobile: true,
      tooltip: t('common.delete'),
    },
  ]

  return (
    <TableProvider<Testimonial>
      apiEndpoint="/api/testimonials"
      dataKey="testimonials"
      idKey="testimonialId"
      columns={columns}
      actions={actions}
    >
      <Table>
        <TableHeader
          title="admin.testimonials.title"
          searchPlaceholder="common.search_placeholder"
          buttons={[{ label: 'common.create', href: '/admin/testimonials/create' }]}
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

export default TestimonialsPage
