import Link from '@/libs/i18n/Link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faListUl, faCheckCircle, faCircle, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import type { PostSeriesRef } from '@/types/content/SeriesTypes'

interface SeriesNavProps {
    seriesRef: PostSeriesRef
    currentPostId: string
}

export default function SeriesNav({ seriesRef, currentPostId }: SeriesNavProps) {
    const { series, order: currentOrder } = seriesRef
    const entries = [...(series.entries ?? [])].sort((a, b) => a.order - b.order)
    const total   = entries.length

    const prevEntry = entries.find((e) => e.order === currentOrder - 1)
    const nextEntry = entries.find((e) => e.order === currentOrder + 1)

    return (
        <aside className="my-8 rounded-2xl border border-base-300 bg-base-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-base-300">
                <FontAwesomeIcon icon={faListUl} className="text-primary" />
                <div>
                    <p className="text-xs text-base-content/50 uppercase tracking-wide font-semibold">Series</p>
                    <p className="font-bold text-base-content leading-tight">{series.title}</p>
                </div>
                <span className="ml-auto badge badge-neutral badge-sm">{currentOrder + 1} / {total}</span>
            </div>

            {/* Entry list */}
            <ol className="divide-y divide-base-300">
                {entries.map((entry) => {
                    const isCurrent = entry.postId === currentPostId
                    const href = `/blog/${entry.post.category.slug}/${entry.post.slug}`
                    const isPublished = entry.post.status === 'PUBLISHED'

                    return (
                        <li key={entry.postId}>
                            {isCurrent ? (
                                <div className="flex items-center gap-3 px-5 py-3 bg-primary/10">
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-primary shrink-0" />
                                    <span className="text-sm font-semibold text-primary">
                                        {entry.order + 1}. {entry.post.title}
                                    </span>
                                </div>
                            ) : isPublished ? (
                                <Link href={href} className="flex items-center gap-3 px-5 py-3 hover:bg-base-300 transition-colors group">
                                    <FontAwesomeIcon icon={faCircle} className="text-base-content/20 group-hover:text-primary shrink-0 text-xs" />
                                    <span className="text-sm text-base-content/70 group-hover:text-base-content">
                                        {entry.order + 1}. {entry.post.title}
                                    </span>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-3 px-5 py-3 opacity-40 cursor-not-allowed">
                                    <FontAwesomeIcon icon={faCircle} className="text-base-content/20 shrink-0 text-xs" />
                                    <span className="text-sm text-base-content/50">
                                        {entry.order + 1}. {entry.post.title}
                                        <span className="ml-2 badge badge-xs badge-neutral">{entry.post.status}</span>
                                    </span>
                                </div>
                            )}
                        </li>
                    )
                })}
            </ol>

            {/* Prev / Next navigation */}
            {(prevEntry || nextEntry) && (
                <div className="flex justify-between gap-3 px-5 py-3 border-t border-base-300">
                    {prevEntry?.post.status === 'PUBLISHED' ? (
                        <Link
                            href={`/blog/${prevEntry.post.category.slug}/${prevEntry.post.slug}`}
                            className="flex items-center gap-2 text-sm text-base-content/60 hover:text-primary transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                            <span className="truncate max-w-[180px]">{prevEntry.post.title}</span>
                        </Link>
                    ) : (
                        <span />
                    )}

                    {nextEntry?.post.status === 'PUBLISHED' ? (
                        <Link
                            href={`/blog/${nextEntry.post.category.slug}/${nextEntry.post.slug}`}
                            className="flex items-center gap-2 text-sm text-base-content/60 hover:text-primary transition-colors ml-auto"
                        >
                            <span className="truncate max-w-[180px]">{nextEntry.post.title}</span>
                            <FontAwesomeIcon icon={faArrowRight} />
                        </Link>
                    ) : (
                        <span />
                    )}
                </div>
            )}
        </aside>
    )
}
