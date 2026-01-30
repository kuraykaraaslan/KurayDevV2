'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { extractHeadings } from '@/helpers/tocUtils';
import type { TOCItem } from '@/helpers/tocUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Extract headings from content
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
        threshold: 0,
      }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  // Smooth scroll handler
  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();

    const element = document.getElementById(id);
    if (!element) return;

    const offset = 100; // fixed header offset
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });

    history.pushState(null, '', `#${id}`);
    setActiveId(id);
  };

  // Hide TOC if too short
  if (headings.length < 2) {
    return null;
  }

  return (
    <nav
      className={`toc bg-base-200 rounded-lg p-4 mb-8 ${className}`}
      aria-label="Table of contents"
    >
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="p-1 rounded hover:bg-base-300 transition"
          aria-label={t(
            'frontend.toc.toggle',
            'Toggle Table of Contents'
          )}
        >
          <FontAwesomeIcon
            icon={faBars}
            size="sm"
            className={`transition-transform ${
              isCollapsed ? 'rotate-90' : ''
            }`}
          />
        </button>
        {t('frontend.toc.title', 'Table of Contents')}
      </h2>

      <ul
        className={`
          space-y-1 text-sm overflow-hidden transition-all duration-300
          ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}
        `}
      >
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
                ${
                  activeId === heading.id
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
