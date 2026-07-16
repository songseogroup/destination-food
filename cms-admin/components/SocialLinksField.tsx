'use client'

import { useState } from 'react'
import {
  Facebook,
  Instagram,
  Link2,
  Linkedin,
  Music2,
  Plus,
  Trash2,
  Twitter,
  Youtube,
} from 'lucide-react'

/**
 * Mirrors `SocialPlatform` in backend/src/common/dto/social-link.dto.ts.
 * The backend validates with @IsEnum, so these strings must stay exact.
 */
export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'twitter'
  | 'tiktok'
  | 'linkedin'
  | 'other'

/**
 * The persisted shape — matches `SocialLinkDto`. Defined here rather than in
 * lib/types.ts so the field owns its own contract.
 */
export interface SocialLink {
  platform: SocialPlatform
  url: string
  label?: string
}

const PLATFORM_OPTIONS: {
  value: SocialPlatform
  name: string
  Icon: typeof Instagram
}[] = [
  { value: 'instagram', name: 'Instagram', Icon: Instagram },
  { value: 'facebook', name: 'Facebook', Icon: Facebook },
  { value: 'youtube', name: 'YouTube', Icon: Youtube },
  { value: 'twitter', name: 'X / Twitter', Icon: Twitter },
  { value: 'tiktok', name: 'TikTok', Icon: Music2 },
  { value: 'linkedin', name: 'LinkedIn', Icon: Linkedin },
  { value: 'other', name: 'Other', Icon: Link2 },
]

const iconFor = (platform: SocialPlatform) =>
  PLATFORM_OPTIONS.find((o) => o.value === platform)?.Icon ?? Link2

/** The backend uses @IsUrl({ require_protocol: true }) — a bare domain 400s. */
const hasProtocol = (url: string) => /^https?:\/\//i.test(url.trim())

/**
 * Drops incomplete rows and normalises whitespace. Call this before building a
 * create/update payload: a row with a blank url fails the backend's @IsUrl and,
 * because the API runs `forbidNonWhitelisted`/validation globally, would 400 the
 * entire request rather than just skipping the link.
 */
export function cleanSocialLinks(links: SocialLink[] | undefined | null): SocialLink[] {
  return (links ?? [])
    .map((link) => ({
      platform: link.platform,
      url: link.url.trim(),
      // `label` only carries meaning for `other`; sending a stale one is noise.
      ...(link.platform === 'other' && link.label?.trim()
        ? { label: link.label.trim() }
        : {}),
    }))
    .filter((link) => link.url.length > 0)
}

interface SocialLinksFieldProps {
  value: SocialLink[]
  onChange: (value: SocialLink[]) => void
}

export function SocialLinksField({ value, onChange }: SocialLinksFieldProps) {
  const links = value ?? []
  // Parallel to `links` so removing a row can't leave an error pointing at the
  // wrong index.
  const [errors, setErrors] = useState<(string | null)[]>([])

  const setErrorAt = (index: number, message: string | null) => {
    setErrors((prev) => {
      const next = [...prev]
      next[index] = message
      return next
    })
  }

  const updateLink = (index: number, patch: Partial<SocialLink>) => {
    onChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)))
  }

  const handlePlatformChange = (index: number, platform: SocialPlatform) => {
    const patch: Partial<SocialLink> =
      platform === 'other' ? { platform } : { platform, label: undefined }
    updateLink(index, patch)
  }

  const addLink = () => {
    onChange([...links, { platform: 'instagram', url: '' }])
    setErrors((prev) => [...prev, null])
  }

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index))
    setErrors((prev) => prev.filter((_, i) => i !== index))
  }

  const validateAt = (index: number, url: string) => {
    const trimmed = url.trim()
    // An untouched empty row is stripped before submit, so don't nag about it.
    if (!trimmed) {
      setErrorAt(index, null)
      return
    }
    setErrorAt(
      index,
      hasProtocol(trimmed) ? null : 'Include the full URL, starting with https://',
    )
  }

  return (
    <div className="space-y-3">
      {links.length === 0 && (
        <p className="text-sm text-charcoal-500">
          No links yet. Add Instagram, Facebook or any other page you want shown.
        </p>
      )}

      {links.map((link, index) => {
        const Icon = iconFor(link.platform)
        const error = errors[index]

        return (
          <div
            key={index}
            className="rounded-xl border border-charcoal-200 bg-charcoal-50 p-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative sm:w-48 sm:shrink-0">
                <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-500" />
                <select
                  value={link.platform}
                  onChange={(e) =>
                    handlePlatformChange(index, e.target.value as SocialPlatform)
                  }
                  className="input-field pl-9"
                  aria-label="Platform"
                >
                  {PLATFORM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <input
                  type="url"
                  value={link.url}
                  maxLength={500}
                  onChange={(e) => {
                    updateLink(index, { url: e.target.value })
                    if (error) setErrorAt(index, null)
                  }}
                  onBlur={(e) => validateAt(index, e.target.value)}
                  className="input-field"
                  placeholder="https://instagram.com/yourvenue"
                  aria-label="Link URL"
                  aria-invalid={!!error}
                />
                {error && (
                  <p className="mt-1 text-sm text-status-danger">{error}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeLink(index)}
                className="btn-ghost self-start px-3 text-charcoal-500 hover:text-status-danger"
                aria-label="Remove link"
                title="Remove link"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {link.platform === 'other' && (
              <div className="mt-3 sm:pr-14">
                <input
                  type="text"
                  value={link.label ?? ''}
                  maxLength={60}
                  onChange={(e) => updateLink(index, { label: e.target.value })}
                  className="input-field"
                  placeholder='Label — e.g. "GoFundMe", "Our charity"'
                  aria-label="Link label"
                />
                <p className="mt-1 text-xs text-charcoal-500">
                  Shown as the link text for anything that isn&apos;t a social network.
                </p>
              </div>
            )}
          </div>
        )
      })}

      <button type="button" onClick={addLink} className="btn-secondary">
        <Plus className="h-4 w-4" />
        Add link
      </button>
    </div>
  )
}
