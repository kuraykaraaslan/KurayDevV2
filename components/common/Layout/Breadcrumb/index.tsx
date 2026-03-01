import Link from '@/libs/i18n/Link'

interface BreadcrumbItem {
  name: string
  url?: string
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.url ? (
              <Link href={item.url} className="">
                {item.name}
              </Link>
            ) : (
              <span>{item.name}</span>
            )}

            {index < items.length - 1 && <span className="mx-2">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
