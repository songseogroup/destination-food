'use client'

import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2, Image as ImageIcon } from 'lucide-react'

/**
 * Repeatable editor for hero carousel slides.
 *
 * Each slide carries its own image + copy + optional CTA. The client adds,
 * edits, reorders and removes slides here; the storefront Banner renders them
 * as a rotating carousel. Controlled — parent owns the array.
 */

export interface HeroSlide {
  image?: string
  highlight?: string
  title?: string
  subtitle?: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
}

interface SlidesEditorProps {
  value: HeroSlide[]
  onChange: (slides: HeroSlide[]) => void
}

const FIELDS: { key: keyof HeroSlide; label: string; placeholder: string; type?: string; full?: boolean }[] = [
  { key: 'image', label: 'Background image URL', placeholder: 'https://…', type: 'url', full: true },
  { key: 'highlight', label: 'Highlight (small line)', placeholder: "Australia's whisky marketplace" },
  { key: 'title', label: 'Title', placeholder: 'Find your next' },
  { key: 'subtitle', label: 'Subtitle (gold line)', placeholder: 'great dram' },
  { key: 'description', label: 'Description', placeholder: 'Book whisky tastings…', full: true },
  { key: 'ctaLabel', label: 'Button label (optional)', placeholder: 'Explore winter events' },
  { key: 'ctaHref', label: 'Button link (optional)', placeholder: '/events', type: 'text' },
]

export function SlidesEditor({ value, onChange }: SlidesEditorProps) {
  const slides = value ?? []

  const update = (i: number, key: keyof HeroSlide, v: string) => {
    const next = slides.map((s, idx) => (idx === i ? { ...s, [key]: v } : s))
    onChange(next)
  }

  const add = () => onChange([...slides, { title: '', subtitle: '' }])

  const remove = (i: number) => onChange(slides.filter((_, idx) => idx !== i))

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= slides.length) return
    const next = [...slides]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {slides.length === 0 && (
        <div className="rounded-xl border border-dashed border-charcoal-300 bg-charcoal-50 px-4 py-6 text-center text-sm text-charcoal-500">
          No slides yet. Add one to build the hero carousel.
        </div>
      )}

      {slides.map((slide, i) => (
        <div key={i} className="rounded-2xl border border-charcoal-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <GripVertical className="h-4 w-4 text-charcoal-400" />
              Slide {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move slide up"
                className="rounded-lg p-1.5 text-charcoal-500 transition-colors hover:bg-charcoal-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === slides.length - 1}
                aria-label="Move slide down"
                className="rounded-lg p-1.5 text-charcoal-500 transition-colors hover:bg-charcoal-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove slide"
                className="rounded-lg p-1.5 text-status-danger transition-colors hover:bg-status-dangerSoft"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Image preview */}
          {slide.image ? (
            <img
              src={slide.image}
              alt=""
              className="mb-3 h-24 w-full rounded-xl object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="mb-3 flex h-24 w-full items-center justify-center rounded-xl bg-charcoal-100 text-charcoal-400">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                <label className="mb-1 block text-xs font-medium text-charcoal-600">{f.label}</label>
                {f.key === 'description' ? (
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder={f.placeholder}
                    value={slide[f.key] ?? ''}
                    onChange={(e) => update(i, f.key, e.target.value)}
                  />
                ) : (
                  <input
                    type={f.type === 'url' ? 'url' : 'text'}
                    className="input-field"
                    placeholder={f.placeholder}
                    value={slide[f.key] ?? ''}
                    onChange={(e) => update(i, f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button type="button" onClick={add} className="btn-secondary w-full">
        <Plus className="h-4 w-4" />
        Add slide
      </button>
    </div>
  )
}
