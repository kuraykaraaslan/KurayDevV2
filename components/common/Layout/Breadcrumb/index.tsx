interface BreadcrumbItem {
    name: string;
    url?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
    return (
        <nav aria-label="Breadcrumb" className="text-sm breadcrumbs">
            {items.map((item, index) => (
                <span key={index}>
                    {item.url ? (
                        <a
                            href={item.url}
                            className=""
                        >
                            {item.name}
                        </a>
                    ) : (
                        <span>{item.name}</span>
                    )}

                    {index < items.length - 1 && (
                        <span className="mx-2">/</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
