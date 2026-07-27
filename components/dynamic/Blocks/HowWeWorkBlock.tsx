'use client'

import BaseBlock, {
  BASE_BLOCK_DEFAULT_PROPS,
  BASE_BLOCK_SCHEMA_FIELDS,
  parseBaseBlockProps,
} from '../partials/BaseBlock'
import { usePreviewMode } from '../partials/PreviewContext'
import type { BlockDefinition } from '../types'

interface WorkItem {
  icon: string
  title: string
  description: string
}

const DEFAULT_ITEMS: WorkItem[] = [
  {
    icon: '🩺',
    title: 'Diagnose before prescribing',
    description: 'We invest time upfront to fully understand your environment before recommending any solution.',
  },
  {
    icon: '👥',
    title: 'Assemble the right expertise',
    description: 'We bring the right mix of skills for each challenge — not a one-size-fits-all team.',
  },
  {
    icon: '🔗',
    title: 'Integrate seamlessly with your teams',
    description: 'We operate as embedded partners, not external consultants dropped in for a week.',
  },
  {
    icon: '🏁',
    title: 'Stay involved until results are delivered',
    description: 'We measure our success by your outcomes, not by hours billed or deliverables handed over.',
  },
]

function parseItems(raw: unknown): WorkItem[] {
  if (Array.isArray(raw)) return raw as WorkItem[]
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch {}
  }
  return DEFAULT_ITEMS
}

function HowWeWorkBlock(rawProps: Record<string, unknown>) {
  const baseProps = parseBaseBlockProps(rawProps)
  const previewMode = usePreviewMode()
  const heading = rawProps.heading as string | undefined
  const cardBg = (rawProps.cardBgColor as string) || 'var(--color-neutral)'
  const iconBg = (rawProps.iconBgColor as string) || 'var(--color-base-300)'
  const accent = (rawProps.accentColor as string) || 'var(--color-primary)'
  const items = parseItems(rawProps.items)

  return (
    <BaseBlock {...baseProps}>
      <div className="relative z-10 max-w-7xl mx-auto">
        {heading && (
          <h2 className="text-4xl md:text-5xl text-neutral-content text-center mb-16">{heading}</h2>
        )}
        <div className={`grid gap-8 grid-cols-1 ${previewMode !== 'mobile' ? 'md:grid-cols-2' : ''}`}>
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-6 p-8 rounded-lg" style={{ backgroundColor: cardBg }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl"
                style={{ backgroundColor: iconBg, color: accent }}
              >
                {item.icon}
              </div>
              <div>
                <h3 className="text-xl text-neutral-content mb-2">{item.title}</h3>
                <p className="leading-relaxed text-neutral-content/70">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseBlock>
  )
}

export const HowWeWorkBlockDefinition: BlockDefinition = {
  type: 'HowWeWorkBlock',
  label: 'How We Work',
  category: 'Company',
  description: '2-column icon card grid with section heading — icon (emoji), title, description per card',
  defaultProps: {
    heading: 'How We Work',
    cardBgColor: 'var(--color-neutral)',
    iconBgColor: 'var(--color-base-300)',
    accentColor: 'var(--color-primary)',
    items: DEFAULT_ITEMS,
    blockClass: 'px-6 md:px-12 lg:px-20 py-20',
    sectionId: 'how-we-work',
    ...BASE_BLOCK_DEFAULT_PROPS,
  },
  schema: {
    heading: { label: 'Section Heading', type: 'text' },
    items: {
      label: 'Items',
      type: 'repeater',
      fields: {
        icon:        { label: 'Icon (emoji)', type: 'text',     value: '⭐' },
        title:       { label: 'Title',        type: 'text',     value: '' },
        description: { label: 'Description', type: 'textarea', value: '' },
      },
    },
    cardBgColor: { label: 'Card Background Color', type: 'color' },
    iconBgColor: { label: 'Icon Circle Background', type: 'color' },
    accentColor: { label: 'Accent Color',           type: 'color' },
    ...BASE_BLOCK_SCHEMA_FIELDS,
  },
  Component: HowWeWorkBlock as unknown as BlockDefinition['Component'],
}

export default HowWeWorkBlock
