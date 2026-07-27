'use client'

import Link from 'next/link'
import BaseBlock, {
  BASE_BLOCK_DEFAULT_PROPS,
  BASE_BLOCK_SCHEMA_FIELDS,
  parseBaseBlockProps,
} from '../partials/BaseBlock'
import type { BlockDefinition } from '../types'

function CTABannerBlock(rawProps: Record<string, unknown>) {
  const baseProps = parseBaseBlockProps(rawProps)
  const heading = (rawProps.heading as string) || "Let's talk."
  const subtitle = rawProps.subtitle as string | undefined
  const ctaLabel = rawProps.ctaLabel as string | undefined
  const ctaHref = (rawProps.ctaHref as string) || '/contact'
  const textColor = (rawProps.textColor as string) || 'var(--color-primary-content)'
  const btnBg = (rawProps.buttonBgColor as string) || 'var(--color-neutral)'
  const btnText = (rawProps.buttonTextColor as string) || 'var(--color-neutral-content)'
  // Banner needs its own (accent) background or the on-accent text is invisible
  // on the page's base background — see the color-contrast a11y audit.
  const backgroundColor = (rawProps.backgroundColor as string) || 'var(--color-primary)'

  return (
    <BaseBlock {...baseProps}>
      <div className="rounded-2xl px-6 py-14 md:py-16" style={{ backgroundColor }}>
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2
          className="text-4xl md:text-5xl mb-8 leading-tight"
          style={{ color: textColor }}
        >
          {heading}
        </h2>

        {subtitle && (
          <p className="text-xl mb-10 opacity-80" style={{ color: textColor }}>
            {subtitle}
          </p>
        )}

        {ctaLabel && (
          <Link
            href={ctaHref}
            className="inline-block px-10 py-5 rounded-md text-lg font-medium hover:scale-105 transition-transform"
            style={{ backgroundColor: btnBg, color: btnText }}
          >
            {ctaLabel}
          </Link>
        )}
      </div>
      </div>
    </BaseBlock>
  )
}

export const CTABannerBlockDefinition: BlockDefinition = {
  type: 'CTABannerBlock',
  label: 'CTA Banner',
  category: 'CTA',
  description: 'Full-width call-to-action banner — accent-colored background by default',
  defaultProps: {
    heading: "Let's talk about what you're building.",
    subtitle: "I'm always open to interesting projects and conversations.",
    ctaLabel: 'Get in Touch',
    ctaHref: '/contact',
    textColor: 'var(--color-primary-content)',
    backgroundColor: 'var(--color-primary)',
    buttonBgColor: 'var(--color-neutral)',
    buttonTextColor: 'var(--color-neutral-content)',
    blockClass: 'py-20 px-6 md:px-12 lg:px-20',
    sectionId: 'cta',
    ...BASE_BLOCK_DEFAULT_PROPS,
  },
  schema: {
    heading: { label: 'Heading', type: 'textarea' },
    subtitle: { label: 'Subtitle', type: 'text' },
    ctaLabel: { label: 'Button Label', type: 'text' },
    ctaHref: { label: 'Button URL', type: 'url' },
    textColor: { label: 'Text Color', type: 'color' },
    backgroundColor: { label: 'Banner Background', type: 'color' },
    buttonBgColor: { label: 'Button Background', type: 'color' },
    buttonTextColor: { label: 'Button Text Color', type: 'color' },
    ...BASE_BLOCK_SCHEMA_FIELDS,
  },
  Component: CTABannerBlock as unknown as BlockDefinition['Component'],
}

export default CTABannerBlock
