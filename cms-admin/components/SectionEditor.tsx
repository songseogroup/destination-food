'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { SlidesEditor, HeroSlide } from './SlidesEditor'

/**
 * Homepage section schema + the per-section edit form.
 *
 * SECTION_LIBRARY is the CMS half of the contract with the storefront: the keys
 * here must stay in sync with the REGISTRY in project/lib/homepage-sections.tsx.
 * A key the storefront doesn't know is skipped at render time rather than
 * blanking the homepage, so an out-of-sync key fails quietly — keep them paired.
 *
 * Every field is optional on the storefront and falls back to shipped copy, so
 * a blank value is safe: we drop empty fields from `content` rather than
 * persisting empty strings that would render as empty headings.
 */

/** One block on the homepage, as returned by GET /homepage. */
export interface HomepageBlock {
  id?: number
  section: string
  content: Record<string, any>
  order: number
  isVisible: boolean
}

type FieldType = 'text' | 'textarea' | 'url' | 'select' | 'list' | 'slides'

interface FieldDef {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  help?: string
  options?: { value: string; label: string }[]
}

interface SectionDef {
  label: string
  description: string
  fields: FieldDef[]
}

/**
 * Blocks the backend refuses to delete (they can only be hidden). Mirrors
 * FIXED_SECTIONS in backend/src/homepage/homepage.service.ts — DELETE returns
 * 400 for these, so the UI never offers Remove on them.
 */
export const CORE_SECTIONS = [
  'banner',
  'featured_bars',
  'featured_distilleries',
  'featured_events',
  'featured_blogs',
]

/** Slots an ad block may occupy. Mirrors AD_SLOTS in project/lib/homepage-sections.tsx. */
export const AD_SLOTS = ['top_hero', 'mid_inline', 'featured_above', 'right_rail'] as const

export type AdSlot = (typeof AD_SLOTS)[number]

export const AD_SLOT_LABELS: Record<AdSlot, string> = {
  top_hero: 'Top of hero',
  mid_inline: 'Mid page (inline)',
  featured_above: 'Above featured',
  right_rail: 'Right rail',
}

const TONE_OPTIONS = [
  { value: 'cream', label: 'Cream' },
  { value: 'white', label: 'White' },
]

/** The four featured rails share a shape — title/description/link label/tone. */
const featuredFields = (subject: string, viewAll: string): FieldDef[] => [
  { name: 'title', label: 'Title', type: 'text', placeholder: `Featured ${subject}` },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: `A line about the ${subject} you're featuring`,
  },
  { name: 'viewAllLabel', label: '"View all" label', type: 'text', placeholder: viewAll },
  {
    name: 'tone',
    label: 'Background tone',
    type: 'select',
    options: TONE_OPTIONS,
    help: 'Alternate cream and white down the page so the rails stay distinct.',
  },
]

export const SECTION_LIBRARY: Record<string, SectionDef> = {
  banner: {
    label: 'Hero carousel',
    description:
      'Rotating hero slides — each with its own image, copy and optional button. Add as many as you like; they auto-rotate. The search box shows on every slide.',
    fields: [
      {
        name: 'slides',
        label: 'Carousel slides',
        type: 'slides',
        help: 'Each slide is a full-screen hero. Reorder with the arrows; the visitor sees them rotate.',
      },
      {
        name: 'searchPlaceholder',
        label: 'Search box placeholder',
        type: 'text',
        placeholder: 'Search tastings, tours, distilleries...',
      },
      {
        name: 'popularSearches',
        label: 'Popular searches',
        type: 'list',
        placeholder: 'Sydney, Melbourne, Hobart',
        help: 'Comma separated. Shown as quick-search chips under the search box.',
      },
    ],
  },
  featured_bars: {
    label: 'Featured bars',
    description: 'Carousel of whisky bars.',
    fields: featuredFields('bars', 'View all bars'),
  },
  featured_distilleries: {
    label: 'Featured distilleries',
    description: 'Carousel of distilleries and tours.',
    fields: featuredFields('distilleries', 'View all distilleries'),
  },
  featured_events: {
    label: 'Featured events',
    description: 'Carousel of upcoming events.',
    fields: featuredFields('events', 'View all events'),
  },
  featured_blogs: {
    label: 'From the journal',
    description: 'Latest posts from the blog.',
    fields: featuredFields('posts', 'Read the journal'),
  },
  site_promo: {
    label: 'Site-wide promo band',
    description:
      'One campaign shown in the same slot on every page (home, bars, distilleries, events, collections, journal). Edit it once — it changes everywhere.',
    fields: [
      {
        name: 'enabled',
        label: 'Show the promo band?',
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes — show on every page' },
          { value: 'no', label: 'No — hide it everywhere' },
        ],
      },
      { name: 'highlight', label: 'Highlight (big accent line)', type: 'text', placeholder: 'Save 10%' },
      { name: 'title', label: 'Title', type: 'text', placeholder: 'Savour Winter' },
      { name: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Through Whisky' },
      { name: 'ctaLabel', label: 'Button label', type: 'text', placeholder: 'Explore Now' },
      { name: 'ctaHref', label: 'Button link', type: 'text', placeholder: '/events' },
      {
        name: 'badgeLabel',
        label: 'Card ribbon',
        type: 'text',
        placeholder: 'Winter Special',
        help: 'Stamped on each card in the band.',
      },
      {
        name: 'source',
        label: 'Cards to show',
        type: 'select',
        options: [
          { value: 'events', label: 'Events & tours' },
          { value: 'bars', label: 'Whisky bars' },
          { value: 'distilleries', label: 'Distilleries' },
        ],
      },
      {
        name: 'discountPercent',
        label: 'Campaign discount %',
        type: 'text',
        placeholder: '10',
        help: 'Optional. Shows a "10% OFF" ribbon and strikethrough price on each card.',
      },
    ],
  },
  site_footer: {
    label: 'Site footer',
    description:
      'The footer on every page. Blank fields fall back to the shipped copy — clearing a field never blanks the footer.',
    fields: [
      {
        name: 'tagline',
        label: 'Tagline',
        type: 'textarea',
        placeholder: 'The marketplace for whisky experiences…',
        help: 'The paragraph under the logo.',
      },
      { name: 'email', label: 'Contact email', type: 'text', placeholder: 'hello@destinationwhisky.life' },
      { name: 'location', label: 'Location', type: 'text', placeholder: 'Sydney, Australia' },
      { name: 'instagram', label: 'Instagram URL', type: 'url', placeholder: 'https://instagram.com/…' },
      { name: 'facebook', label: 'Facebook URL', type: 'url', placeholder: 'https://facebook.com/…' },
      { name: 'youtube', label: 'YouTube URL', type: 'url', placeholder: 'https://youtube.com/…' },
      { name: 'twitter', label: 'X (Twitter) URL', type: 'url', placeholder: 'https://x.com/…' },
      {
        name: 'copyright',
        label: 'Copyright line',
        type: 'text',
        placeholder: '© 2026 Destination Whisky. All rights reserved.',
      },
    ],
  },
}

/**
 * Ad blocks are keyed `ad:<slot>`, so the slot select drives the section key.
 *
 * The block now carries its own content: an image banner (title/subtitle/image/
 * link) OR — for the `featured_above` slot — promo-band campaign copy. When the
 * image + promo fields are all blank, the storefront falls back to the live
 * /banners campaign for the slot, so existing `{slot}`-only blocks still work.
 */
const AD_SECTION_DEF: SectionDef = {
  label: 'Ad slot',
  description:
    'A banner block. Fill in the image + link for a standard ad, or the campaign copy for the "Above featured" promo band. Leave everything blank to serve the live /banners campaign for the slot.',
  fields: [
    {
      name: 'slot',
      label: 'Slot',
      type: 'select',
      options: AD_SLOTS.map((slot) => ({ value: slot, label: AD_SLOT_LABELS[slot] })),
      help: 'Where the banner sits. Each slot can only hold one block.',
    },
    { name: 'title', label: 'Title', type: 'text', placeholder: 'Winter whisky sale' },
    { name: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Up to 20% off tastings' },
    {
      name: 'imageUrl',
      label: 'Image URL',
      type: 'url',
      placeholder: 'https://…',
      help: 'Shown as the banner image. Leave blank to serve the live /banners campaign for this slot instead.',
    },
    { name: 'linkUrl', label: 'Link URL', type: 'url', placeholder: 'https://… or /events' },
    {
      name: 'highlight',
      label: 'Highlight',
      type: 'text',
      placeholder: 'Save 10%',
      help: 'Promo band only ("Above featured" slot) — the big accent line.',
    },
    { name: 'ctaLabel', label: 'Button label', type: 'text', placeholder: 'Explore now' },
    {
      name: 'badgeLabel',
      label: 'Card badge',
      type: 'text',
      placeholder: 'Winter Special',
      help: 'Promo band only — ribbon stamped on each card.',
    },
  ],
}

/**
 * Rich-text / CTA blocks are keyed `rich_text` (first) then `rich_text:<n>`, so
 * several can sit at different positions. The `rich_text` prefix resolves to
 * this one editor, mirroring how the `ad:` prefix resolves to AD_SECTION_DEF.
 */
const RICH_TEXT_SECTION_DEF: SectionDef = {
  label: 'Text / CTA block',
  description: 'A free-form heading, paragraph and optional button — place it anywhere on the page.',
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', placeholder: 'A word on our whisky' },
    { name: 'body', label: 'Body', type: 'textarea', placeholder: 'A paragraph of copy…' },
    { name: 'ctaLabel', label: 'Button label', type: 'text', placeholder: 'Learn more' },
    { name: 'ctaHref', label: 'Button link', type: 'url', placeholder: 'https://… or /about' },
    {
      name: 'tone',
      label: 'Background tone',
      type: 'select',
      options: TONE_OPTIONS,
      help: 'Cream sits on a warm gold wash; white is plain.',
    },
    {
      name: 'align',
      label: 'Alignment',
      type: 'select',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
      ],
    },
  ],
}

export const isAdSection = (section: string) => section.startsWith('ad:')

/** Matches `rich_text` and `rich_text:<n>` — the whole family shares one editor. */
export const isRichTextSection = (section: string) =>
  section === 'rich_text' || section.startsWith('rich_text:')

export const isCoreSection = (section: string) => CORE_SECTIONS.includes(section)

/** Null for a key this build has no editor for (e.g. a block added by a newer deploy). */
export function getSectionDef(section: string): SectionDef | null {
  if (isAdSection(section)) return AD_SECTION_DEF
  if (isRichTextSection(section)) return RICH_TEXT_SECTION_DEF
  return SECTION_LIBRARY[section] ?? null
}

export function sectionLabel(section: string): string {
  if (isAdSection(section)) {
    const slot = section.slice(3) as AdSlot
    return `Ad — ${AD_SLOT_LABELS[slot] ?? slot.replace(/_/g, ' ')}`
  }
  if (isRichTextSection(section)) {
    // Number the extras so multiple text blocks stay distinguishable in the list.
    const suffix = section.includes(':') ? ` ${section.split(':')[1]}` : ''
    return `${RICH_TEXT_SECTION_DEF.label}${suffix}`
  }
  return SECTION_LIBRARY[section]?.label ?? section.replace(/_/g, ' ')
}

/** One-line preview of a block's copy for the builder row. */
export function sectionSummary(block: HomepageBlock): string {
  if (isAdSection(block.section)) {
    const slot = (block.content?.slot ?? block.section.slice(3)) as AdSlot
    return `Slot: ${AD_SLOT_LABELS[slot] ?? slot}`
  }
  if (isRichTextSection(block.section)) {
    return block.content?.heading || 'Empty text block — add a heading or body.'
  }
  if (block.section === 'banner') {
    const n = Array.isArray(block.content?.slides) ? block.content!.slides.length : 0
    if (n) return `${n} slide${n > 1 ? 's' : ''} in the carousel`
    return block.content?.title || 'Single hero — add slides to make it a carousel'
  }
  const def = getSectionDef(block.section)
  if (!def) return 'No editor in this build — this block is left as-is.'
  return block.content?.title || def.description
}

interface SectionEditorProps {
  block: HomepageBlock
  /** Every section key currently on the page — used to keep ad slots unique. */
  takenSections: string[]
  isSaving: boolean
  /**
   * `nextSection` differs from `block.section` only when an ad block's slot
   * changed; the key is derived from the slot, so the caller has to re-key it.
   */
  onSubmit: (result: { content: Record<string, any>; nextSection: string }) => void
  onCancel: () => void
}

export function SectionEditor({
  block,
  takenSections,
  isSaving,
  onSubmit,
  onCancel,
}: SectionEditorProps) {
  const def = getSectionDef(block.section)

  const { register, handleSubmit, formState } = useForm<Record<string, string>>({
    defaultValues: buildDefaults(block, def),
  })

  // Carousel slides are an array of objects, so they're controlled here rather
  // than through react-hook-form's flat fields. Seeded from the legacy single-
  // hero fields when a banner has no slides yet, so an old banner shows up as
  // "Slide 1" ready to edit.
  const [slides, setSlides] = useState<HeroSlide[]>(() => initialSlides(block))

  if (!def) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-6 text-charcoal-600">
          <span className="font-semibold text-ink">{block.section}</span> has no editor in this build
          of the CMS. You can still reorder or hide it — its content is left untouched.
        </p>
        <pre className="max-h-64 overflow-auto rounded-xl bg-charcoal-50 p-4 text-xs text-charcoal-700">
          {JSON.stringify(block.content ?? {}, null, 2)}
        </pre>
        <div className="flex justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    )
  }

  const submit = handleSubmit((values) => {
    // Start from the stored content so keys this build has no field for survive
    // the round trip — POST /homepage/update replaces `content` wholesale.
    const content: Record<string, any> = { ...(block.content ?? {}) }

    for (const field of def.fields) {
      // Slides are controlled separately (not a react-hook-form value) — handled
      // after this loop. Skip so an undefined form value doesn't wipe them.
      if (field.type === 'slides') continue

      const raw = values[field.name] ?? ''
      if (field.type === 'list') {
        const list = raw
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
        if (list.length) content[field.name] = list
        else delete content[field.name]
      } else {
        const value = raw.trim()
        if (value) content[field.name] = value
        else delete content[field.name]
      }
    }

    if (def.fields.some((f) => f.type === 'slides')) {
      const cleaned = cleanSlides(slides)
      if (cleaned.length) content.slides = cleaned
      else delete content.slides
    }

    const nextSection = isAdSection(block.section) ? `ad:${values.slot}` : block.section
    onSubmit({ content, nextSection })
  })

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="section-description mt-0">{def.description}</p>

      {def.fields.map((field) => {
        const error = formState.errors[field.name]?.message as string | undefined

        return (
          <div key={field.name}>
            <label htmlFor={`field-${field.name}`} className="label">
              {field.label}
            </label>

            {field.type === 'slides' ? (
              <SlidesEditor value={slides} onChange={setSlides} />
            ) : field.type === 'textarea' ? (
              <textarea
                id={`field-${field.name}`}
                rows={3}
                className="input-field"
                placeholder={field.placeholder}
                {...register(field.name)}
              />
            ) : field.type === 'select' ? (
              <select
                id={`field-${field.name}`}
                className="input-field"
                {...register(field.name, {
                  validate: (value) =>
                    validateSlot({ field, value, block, takenSections }),
                })}
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`field-${field.name}`}
                type={field.type === 'url' ? 'url' : 'text'}
                className="input-field"
                placeholder={field.placeholder}
                {...register(field.name)}
              />
            )}

            {field.help && !error ? (
              <p className="mt-1.5 text-xs leading-5 text-charcoal-500">{field.help}</p>
            ) : null}
            {error ? <p className="mt-1.5 text-xs font-medium text-status-danger">{error}</p> : null}
          </div>
        )
      })}

      <div className="flex justify-end gap-3 border-t border-charcoal-200 pt-5">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={isSaving}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save section'}
        </button>
      </div>
    </form>
  )
}

/** An ad block's key is `ad:<slot>`, and keys are unique — so slots must be too. */
function validateSlot({
  field,
  value,
  block,
  takenSections,
}: {
  field: FieldDef
  value: string
  block: HomepageBlock
  takenSections: string[]
}): string | true {
  if (field.name !== 'slot' || !isAdSection(block.section)) return true
  const nextKey = `ad:${value}`
  if (nextKey === block.section) return true
  if (takenSections.includes(nextKey)) return 'That slot already has a block on the page.'
  return true
}

/**
 * Slides shown when the banner editor opens. Uses the stored `slides` array; if
 * there is none, seeds one slide from the legacy single-hero fields so an old
 * banner opens as "Slide 1" instead of an empty carousel.
 */
function initialSlides(block: HomepageBlock): HeroSlide[] {
  const existing = block.content?.slides
  if (Array.isArray(existing) && existing.length) return existing as HeroSlide[]

  const c = block.content ?? {}
  const seeded: HeroSlide = {
    image: c.backgroundImage,
    highlight: c.highlight,
    title: c.title,
    subtitle: c.subtitle,
    description: c.description,
  }
  const hasAny = Object.values(seeded).some((v) => typeof v === 'string' && v.trim())
  return hasAny ? [seeded] : []
}

/** Trim strings, drop blank keys, and drop slides that have nothing in them. */
function cleanSlides(slides: HeroSlide[]): HeroSlide[] {
  return slides
    .map((s) => {
      const out: HeroSlide = {}
      for (const [k, v] of Object.entries(s)) {
        if (typeof v === 'string' && v.trim()) (out as any)[k] = v.trim()
      }
      return out
    })
    .filter((s) => s.image || s.title || s.subtitle || s.highlight || s.description)
}

function buildDefaults(block: HomepageBlock, def: SectionDef | null): Record<string, string> {
  const defaults: Record<string, string> = {}
  if (!def) return defaults

  for (const field of def.fields) {
    const value = block.content?.[field.name]
    if (field.type === 'list') {
      defaults[field.name] = Array.isArray(value) ? value.join(', ') : ''
    } else if (field.type === 'select') {
      // Fall back to the key's own slot: `content.slot` can be missing on rows
      // seeded before the field existed.
      const fallback =
        field.name === 'slot' && isAdSection(block.section)
          ? block.section.slice(3)
          : field.options?.[0]?.value ?? ''
      defaults[field.name] = typeof value === 'string' && value ? value : fallback
    } else {
      defaults[field.name] = typeof value === 'string' ? value : ''
    }
  }

  return defaults
}
