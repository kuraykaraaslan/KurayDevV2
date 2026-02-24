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

const TestimonialsPage = () => {
  const { t } = useTranslation()

  const columns: ColumnDef<Testimonial>[] = [
    {
      key: 'image',
      header: 'Image',
      className: 'w-16',
      accessor: (item) => <ImageCell src={item.image} alt={item.name} />,
    },
    { key: 'name', header: 'Name', accessor: (item) => item.name },
    { key: 'title', header: 'Title', accessor: (item) => item.title },
    {
      key: 'review',
      header: 'Review',
      hideOnMobile: true,
      accessor: (item) => (
        <span className="line-clamp-2 text-sm text-base-content/70 max-w-xs">{item.review}</span>
      ),
    },
    { key: 'status', header: 'Status', accessor: (item) => item.status },
  ]

  const actions: ActionButton<Testimonial>[] = [
    {
      label: 'Edit',
      href: (item) => `/admin/testimonials/${item.testimonialId}`,
      className: 'btn-secondary',
    },
    {
      label: 'Delete',
      onClick: async (item) => {
        if (!confirm(t('Are you sure you want to delete this testimonial?'))) return
        await axiosInstance.delete(`/api/testimonials/${item.testimonialId}`)
      },
      className: 'btn-error',
      hideOnMobile: true,
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
          title="Testimonials"
          searchPlaceholder="Search testimonials..."
          buttonText="Add Testimonial"
          buttonLink="/admin/testimonials/create"
        />
        <TableBody />
        <TableFooter
          showingText="Showing"
          previousText="Previous"
          nextText="Next"
        />
      </Table>
    </TableProvider>
  )
}

export default TestimonialsPage
