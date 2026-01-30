'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { extractHeadings } from '@/helpers/tocUtils';
import type { TOCItem } from '@/helpers/tocUtils';

export type { TOCItem } from '@/helpers/tocUtils';
export { extractHeadings, generateSlug, addHeadingIds } from '@/helpers/tocUtils';

interface TableOfContentsProps {
    content: string;
    className?: string;
}

const TableOfContents = ({ content, className = '' }: TableOfContentsProps) => {
    const { t } = useTranslation();
    const [headings, setHeadings] = useState<TOCItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        const extracted = extractHeadings(content);
        setHeadings(extracted);
    }, [content]);

    // Track active heading on scroll
    useEffect(() => {
        if (headings.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-80px 0px -80% 0px',
                threshold: 0
            }
        );

        headings.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [headings]);

    if (headings.length < 2) {
        return null; // Don't show TOC for very short articles
    }

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const offset = 100; // Account for fixed header
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Update URL hash without jumping
            history.pushState(null, '', `#${id}`);
            setActiveId(id);
        }
    };

    return (
        <nav className={`toc bg-base-200 rounded-lg p-4 mb-8 ${className}`} aria-label="Table of contents">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {t('frontend.toc.title', 'Table of Contents')}
            </h2>
            <ul className="space-y-1 text-sm">
                {headings.map((heading, index) => (
                    <li
                        key={`${heading.id}-${index}`}
                        className={heading.level === 3 ? 'ml-4' : ''}
                    >
                        <a
                            href={`#${heading.id}`}
                            onClick={(e) => handleClick(e, heading.id)}
                            className={`
                                block py-1 px-2 rounded transition-colors duration-200
                                hover:bg-base-300 hover:text-primary
                                ${activeId === heading.id 
                                    ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary' 
                                    : 'text-base-content/70'
                                }
                            `}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default TableOfContents;
