import fs from 'fs/promises'
import path from 'path'
import openai from '@/libs/openai'
import type { BlockData } from '@/dtos/DynamicPageDTO'
import type { DynamicPage } from '@/types/content/PageTypes'
import { CURRENT_SCHEMA_VERSION } from '@/types/content/PageTypes'


interface BlockPropHint {
  name: string
  label: string
  fieldType: string  // 'text' | 'json' | 'select' | 'color' | ...
  options?: string[]
  placeholder?: string
}

interface BlockMeta {
  type: string
  description: string
  props: BlockPropHint[]
}

interface SelectedBlock {
  blockType: string
  order: number
  purpose: string
}

interface SelectionResult {
  title: string
  slug: string
  description: string
  keywords: string[]
  metadata: DynamicPage['metadata']
  selectedBlocks: SelectedBlock[]
}

const BLOCKS_DIR = path.join(process.cwd(), 'components/dynamic/Blocks')

// Parse a single block .tsx file to extract type, description, and prop schema
async function parseBlockFile(filePath: string): Promise<BlockMeta | null> {
  const content = await fs.readFile(filePath, 'utf-8')

  // Find the Definition export start
  const defIdx = content.search(/export const \w+Definition\s*:\s*BlockDefinition/)
  if (defIdx === -1) return null

  const afterDef = content.slice(defIdx)

  // Locate sub-sections
  const schemaMarker = '  schema: {'
  const componentMarker = '  Component:'
  const defaultPropsMarker = '  defaultProps:'

  const schemaStart = afterDef.indexOf(schemaMarker)
  const componentStart = afterDef.indexOf(componentMarker)
  const defaultPropsStart = afterDef.indexOf(defaultPropsMarker)

  // Top-level metadata lives before defaultProps (or schema if no defaultProps)
  const topEnd = defaultPropsStart > 0 ? defaultPropsStart : schemaStart > 0 ? schemaStart : 500
  const topLevel = afterDef.slice(0, topEnd)

  // Extract block type (first `type: 'xxx'` in top-level)
  const typeMatch = topLevel.match(/\btype:\s*['"]([^'"]+)['"]/)
  if (!typeMatch) return null

  // Extract description — handles both inline and next-line value
  const descMatch =
    topLevel.match(/\bdescription:\s*\n?\s*'([^']+)'/) ||
    topLevel.match(/\bdescription:\s*\n?\s*"([^"]+)"/) ||
    topLevel.match(/\bdescription:\s*\n?\s*`([^`]+)`/)

  // Extract schema section
  const schemaEnd = componentStart > schemaStart ? componentStart : afterDef.length
  const schemaSection =
    schemaStart > 0 ? afterDef.slice(schemaStart, schemaEnd) : ''

  // Prop names: identifiers at exactly 4-space indent inside schema followed by `: {`
  const propNameMatches = [...schemaSection.matchAll(/^    (\w+):\s*\{/gm)]
  const propNames = propNameMatches.map((m) => m[1])

  // Labels appear once per prop, in declaration order
  const labelMatches = [...schemaSection.matchAll(/\blabel:\s*'([^']+)'/g)]

  // Field types (skip the block-level `type:` which is already consumed above)
  const fieldTypeMatches = [...schemaSection.matchAll(/\btype:\s*'([^']+)'/g)]

  // Options arrays
  const optionMatches = [...schemaSection.matchAll(/\boptions:\s*\[([^\]]+)\]/g)]

  // Placeholders
  const placeholderMatches = [...schemaSection.matchAll(/\bplaceholder:\s*'([^']+)'/g)]

  // Build per-prop option/placeholder lookup by position is not trivial;
  // instead scan the schema line-by-line to pair names with their options/placeholders
  const props: BlockPropHint[] = propNames.map((name, i) => ({
    name,
    label: labelMatches[i]?.groups?.[1] ?? labelMatches[i]?.[1] ?? name,
    fieldType: fieldTypeMatches[i]?.[1] ?? 'text',
    options: optionMatches[i]
      ? optionMatches[i][1]
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''))
      : undefined,
    placeholder: placeholderMatches[i]?.[1],
  }))

  return {
    type: typeMatch[1],
    description: descMatch?.[1] ?? typeMatch[1],
    props,
  }
}

// Step 1: Read the Blocks directory live and build a catalog
async function loadBlockCatalog(): Promise<BlockMeta[]> {
  const files = (await fs.readdir(BLOCKS_DIR)).filter((f) => f.endsWith('.tsx'))
  const results = await Promise.all(
    files.map((f) => parseBlockFile(path.join(BLOCKS_DIR, f))),
  )
  return results.filter((b): b is BlockMeta => b !== null)
}

// Format a block's props into a concise hint string for the AI
function buildPropsHint(meta: BlockMeta): string {
  return meta.props
    .map((p) => {
      if (p.fieldType === 'json') {
        const ex = p.placeholder ? ` — JSON array, e.g. ${p.placeholder}` : ' — JSON array'
        return `${p.name} (${p.label})${ex}`
      }
      if (p.fieldType === 'select' && p.options) {
        return `${p.name} (${p.label}) — one of: ${p.options.join(' | ')}`
      }
      if (p.fieldType === 'color') {
        return null // skip color props — blocks use theme defaults when empty
      }
      if (p.fieldType === 'img' || p.fieldType === 'url' && p.name.toLowerCase().includes('image')) {
        return null // skip image props
      }
      return `${p.name} (${p.label})`
    })
    .filter(Boolean)
    .join('\n  ')
}

// Step 2: First AI call — pick 3-7 blocks and page metadata
async function selectBlocks(userPrompt: string, catalog: BlockMeta[]): Promise<SelectionResult> {
  const catalogText = catalog
    .map((b) => `${b.type} — ${b.description}`)
    .join('\n')

  const system = `You are a web page architect. Given a topic, pick 3-7 block components that form a complete, well-structured landing page.

AVAILABLE BLOCKS (${catalog.length} total):
${catalogText}

OUTPUT: Valid JSON only, no markdown fences. Schema:
{
  "title": "Page title 60-70 chars",
  "slug": "lowercase-hyphens-only-max-50-chars",
  "description": "Meta description 150-160 chars",
  "keywords": ["keyword1", "keyword2"],
  "metadata": { "ogTitle": "...", "ogDescription": "..." },
  "selectedBlocks": [
    { "blockType": "ExactTypeName", "order": 0, "purpose": "Specific content goal for this block" }
  ]
}

RULES:
1. First block MUST be a Hero variant: HeroLandingBlock, HeroSplitBlock, or HeroMinimalBlock
2. Last block should be a CTA: CTABannerBlock or FooterCtaBlock
3. Pick 3-7 blocks — blockType MUST match exactly one of the available types above
4. purpose describes WHAT content goes in this block, specific to the topic
5. Write title, description, purpose in the same language as the user prompt
6. Slug: /^[a-z0-9-]+$/, max 50 chars`

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1000,
  })

  const raw = res.choices[0].message.content
  if (!raw) throw new Error('No content from block selection AI')

  const parsed = JSON.parse(raw) as SelectionResult

  if (!parsed.title || !parsed.slug || !Array.isArray(parsed.selectedBlocks) || parsed.selectedBlocks.length === 0) {
    throw new Error('AI returned invalid block selection')
  }

  return parsed
}

// Step 3: Per-block AI call — fill one block's props
async function fillBlock(
  selected: SelectedBlock,
  meta: BlockMeta,
  userPrompt: string,
): Promise<BlockData | null> {
  const propsHint = buildPropsHint(meta)

  const system = `You are a web content writer. Fill ALL props for a single landing page block.

BLOCK TYPE: ${meta.type}
BLOCK DESCRIPTION: ${meta.description}
CONTENT GOAL: ${selected.purpose}
PAGE TOPIC: ${userPrompt}

PROPS TO FILL:
  ${propsHint}

OUTPUT: Valid JSON only, no markdown fences. Schema:
{ "props": { "propName": "value" } }

RULES:
1. Fill EVERY prop listed — never empty, never placeholder text
2. JSON array props: provide 3-5 items, all topic-specific
3. Do NOT include any color props (bgColor, accentColor, etc.) — omit them entirely so blocks use theme defaults
4. Do NOT include imageUrl or imageAlt props
5. CTA hrefs: use /contact or /solutions
6. Write in the same language as the page topic`

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Fill props for block ${selected.order + 1}: ${meta.type}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    })

    const raw = res.choices[0].message.content
    if (!raw) return null

    const parsed = JSON.parse(raw) as { props: Record<string, unknown> }
    if (!parsed.props || typeof parsed.props !== 'object') return null

    return {
      id: `block-${selected.order + 1}`,
      type: selected.blockType,
      order: selected.order,
      props: parsed.props,
    }
  } catch (err) {
    console.error(`Failed to fill block ${selected.blockType}:`, err)
    return null
  }
}

export default class AIPageGeneratorService {
  static async generate(userPrompt: string): Promise<Omit<DynamicPage, 'dynamicPageId' | 'createdAt' | 'updatedAt'>> {
    // Step 1: Read the live Blocks directory
    const catalog = await loadBlockCatalog()
    console.log(`[AIPageGenerator] Loaded ${catalog.length} blocks from registry`)

    // Step 2: Pick blocks + page metadata (single lightweight AI call)
    const selection = await selectBlocks(userPrompt, catalog)
    console.log(`[AIPageGenerator] Selected ${selection.selectedBlocks.length} blocks:`, selection.selectedBlocks.map((b) => b.blockType))

    // Validate selected block types exist in catalog
    const catalogMap = new Map(catalog.map((b) => [b.type, b]))
    const validBlocks = selection.selectedBlocks.filter((s) => {
      if (!catalogMap.has(s.blockType)) {
        console.warn(`[AIPageGenerator] Unknown block type "${s.blockType}" — skipping`)
        return false
      }
      return true
    })

    if (validBlocks.length === 0) {
      throw new Error('No valid blocks selected — all block types were unknown')
    }

    // Step 3: Fill each valid block in parallel
    const filledBlocks = await Promise.all(
      validBlocks.map((selected) =>
        fillBlock(selected, catalogMap.get(selected.blockType)!, userPrompt),
      ),
    )

    // Step 4: Assemble final page, drop failed blocks
    const sections: BlockData[] = filledBlocks
      .filter((b): b is BlockData => b !== null)
      .sort((a, b) => a.order - b.order)

    if (sections.length === 0) {
      throw new Error('All block fills failed — no sections generated')
    }

    return {
      title: selection.title,
      slug: selection.slug,
      description: selection.description,
      keywords: selection.keywords ?? [],
      sections,
      metadata: selection.metadata ?? {},
      status: 'DRAFT',
      schemaVersion: CURRENT_SCHEMA_VERSION,
    }
  }
}
