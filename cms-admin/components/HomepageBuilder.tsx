'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Megaphone,
  PanelBottom,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { api } from '@/lib/api'
import { Modal } from '@/components/Modal'
import { SitePreview } from '@/components/SitePreview'
import {
  AD_SLOTS,
  AD_SLOT_LABELS,
  AdSlot,
  HomepageBlock,
  SectionEditor,
  isAdSection,
  isCoreSection,
  sectionLabel,
  sectionSummary,
} from '@/components/SectionEditor'

/**
 * Drag-and-drop homepage builder.
 *
 * Layout edits (order + visibility) are optimistic and local until Save: a drag
 * fires no request, so the admin can shuffle freely and back out. Save sends the
 * whole list to POST /homepage/reorder, which applies it in one transaction.
 *
 * Content edits and structural changes (add/remove a block) persist immediately,
 * because they have no meaningful "draft" state to hold.
 *
 * The API runs `forbidNonWhitelisted`, so an extra field 400s the whole request
 * with no partial save — every payload below sends only its DTO's fields.
 */

/** GET /homepage returns extra columns (id, timestamps); we only model what we use. */
const normalize = (rows: HomepageBlock[]): HomepageBlock[] =>
  rows.map((row) => ({
    id: row.id,
    section: row.section,
    content: row.content ?? {},
    order: row.order ?? 0,
    // Boolean columns can come back as 0/1 depending on the driver.
    isVisible: !!row.isVisible,
  }))

/** Nest's ValidationPipe returns `message` as a string or an array of strings. */
function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as any)?.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string') return message
  return fallback
}

export function HomepageBuilder() {
  const queryClient = useQueryClient()
  const [items, setItems] = useState<HomepageBlock[] | null>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)
  // The footer isn't positional, so it's edited via its own button and a
  // synthetic block rather than a row in the reorderable list.
  const [footerBlock, setFooterBlock] = useState<HomepageBlock | null>(null)
  const [footerLoading, setFooterLoading] = useState(false)
  // The site-wide promo band is global too (same on every page), so it's edited
  // via its own button just like the footer — never a draggable row.
  const [promoBlock, setPromoBlock] = useState<HomepageBlock | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)

  // The builder reads GET /homepage (not /homepage/layout) so hidden blocks
  // still appear here — they're invisible on the site, not in the CMS.
  const { data, isLoading, isError } = useQuery<HomepageBlock[]>('homepage', () =>
    api.get('/homepage').then((res) =>
      // site_footer and site_promo are edited via their own buttons, not as
      // draggable rows — keep them out of the reorderable list so they can't be
      // dragged or counted dirty.
      (res.data as HomepageBlock[]).filter(
        (row) => row.section !== 'site_footer' && row.section !== 'site_promo',
      )
    )
  )

  const isDirty = useMemo(() => {
    if (!items || !data) return false
    // A length change means a block was added/removed server-side; those aren't
    // draftable, so there's nothing local to protect.
    if (items.length !== data.length) return false
    return items.some(
      (item, index) =>
        data[index].section !== item.section || !!data[index].isVisible !== item.isVisible
    )
  }, [items, data])

  // Read inside the sync effect below without making it re-run on every render.
  const dirtyRef = useRef(false)
  dirtyRef.current = isDirty
  const itemsRef = useRef<HomepageBlock[] | null>(null)
  itemsRef.current = items

  /**
   * Structural mutations rewrite the list under us, and re-slotting an ad block
   * swaps its section key outright — which reads as "dirty" against the old
   * local list. Without this the builder would pin itself to a block that no
   * longer exists and let Save POST a dead key (a 400 for the whole request),
   * so those mutations force the next refetch to win.
   */
  const forceResyncRef = useRef(false)

  // Adopt server state on load and after every refetch — unless the admin has
  // unsaved layout changes, which must survive a background refetch.
  useEffect(() => {
    if (!data) return
    const force = forceResyncRef.current
    forceResyncRef.current = false
    if (itemsRef.current !== null && dirtyRef.current && !force) return
    setItems(normalize(data))
  }, [data])

  const bumpPreview = () => setRefreshToken((value) => value + 1)

  const reorderMutation = useMutation(
    (sections: { section: string; order: number; isVisible: boolean }[]) =>
      api.post('/homepage/reorder', { sections }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('homepage')
        toast.success('Homepage layout saved')
        bumpPreview()
      },
      onError: (error) => {
        toast.error(apiErrorMessage(error, 'Failed to save layout'))
      },
    }
  )

  const updateMutation = useMutation(
    ({ section, content }: { section: string; content: Record<string, any> }) =>
      api.post('/homepage/update', { section, content }),
    {
      onSuccess: (_result, variables) => {
        // Patch local state too: a refetch won't overwrite `items` while the
        // layout is dirty, which would otherwise leave the edited copy stale.
        setItems((previous) =>
          previous?.map((item) =>
            item.section === variables.section ? { ...item, content: variables.content } : item
          ) ?? previous
        )
        queryClient.invalidateQueries('homepage')
        toast.success('Section updated')
        setEditingSection(null)
        bumpPreview()
      },
      onError: (error) => {
        toast.error(apiErrorMessage(error, 'Failed to update section'))
      },
    }
  )

  /**
   * Moving an ad block to a different slot changes its key (`ad:<slot>`), and
   * keys are the primary identity — so this is a create + delete, not an update.
   * The new row is created at the old row's `order` so the block keeps its place.
   */
  const reslotMutation = useMutation(
    async ({
      from,
      to,
      content,
      order,
    }: {
      from: string
      to: string
      content: Record<string, any>
      order: number
    }) => {
      await api.post('/homepage/update', { section: to, content, order })
      await api.delete(`/homepage/${encodeURIComponent(from)}`)
    },
    {
      onSuccess: () => {
        forceResyncRef.current = true
        queryClient.invalidateQueries('homepage')
        toast.success('Ad slot moved')
        setEditingSection(null)
        bumpPreview()
      },
      onError: (error) => {
        toast.error(apiErrorMessage(error, 'Failed to move ad slot'))
      },
    }
  )

  const addMutation = useMutation(
    ({ section, content }: { section: string; content: Record<string, any> }) =>
      api.post('/homepage/update', { section, content }),
    {
      onSuccess: () => {
        forceResyncRef.current = true
        queryClient.invalidateQueries('homepage')
        toast.success('Block added to the end of the page')
        bumpPreview()
      },
      onError: (error) => {
        toast.error(apiErrorMessage(error, 'Failed to add block'))
      },
    }
  )

  // Footer edits go to their own section key and never touch the layout array.
  const saveFooterMutation = useMutation(
    (content: Record<string, any>) =>
      api.post('/homepage/update', { section: 'site_footer', content }),
    {
      onSuccess: () => {
        toast.success('Footer updated')
        setFooterBlock(null)
        bumpPreview()
      },
      onError: (error) => {
        toast.error(apiErrorMessage(error, 'Failed to update footer'))
      },
    }
  )

  const openFooterEditor = async () => {
    setFooterLoading(true)
    try {
      // 404 when the footer has never been customised — start from an empty
      // block so every field falls back to the storefront's shipped copy.
      const res = await api.get('/homepage/site_footer')
      setFooterBlock({
        section: 'site_footer',
        content: res.data?.content ?? {},
        order: 0,
        isVisible: true,
      })
    } catch {
      setFooterBlock({ section: 'site_footer', content: {}, order: 0, isVisible: true })
    } finally {
      setFooterLoading(false)
    }
  }

  // Site-wide promo edits go to their own section key, same as the footer.
  const savePromoMutation = useMutation(
    (content: Record<string, any>) =>
      api.post('/homepage/update', { section: 'site_promo', content }),
    {
      onSuccess: () => {
        toast.success('Site promo updated')
        setPromoBlock(null)
        bumpPreview()
      },
      onError: (error) => {
        toast.error(apiErrorMessage(error, 'Failed to update site promo'))
      },
    }
  )

  const openPromoEditor = async () => {
    setPromoLoading(true)
    try {
      const res = await api.get('/homepage/site_promo')
      setPromoBlock({
        section: 'site_promo',
        content: res.data?.content ?? {},
        order: 0,
        isVisible: true,
      })
    } catch {
      setPromoBlock({ section: 'site_promo', content: {}, order: 0, isVisible: true })
    } finally {
      setPromoLoading(false)
    }
  }

  const removeMutation = useMutation(
    (section: string) => api.delete(`/homepage/${encodeURIComponent(section)}`),
    {
      onSuccess: () => {
        forceResyncRef.current = true
        queryClient.invalidateQueries('homepage')
        toast.success('Block removed')
        bumpPreview()
      },
      onError: (error) => {
        toast.error(apiErrorMessage(error, 'Failed to remove block'))
      },
    }
  )

  const sensors = useSensors(
    // A small threshold so a click on the handle isn't swallowed as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !items) return

    const from = items.findIndex((item) => item.section === active.id)
    const to = items.findIndex((item) => item.section === over.id)
    if (from === -1 || to === -1) return

    setItems(arrayMove(items, from, to))
  }

  const toggleVisibility = (section: string) => {
    setItems(
      (previous) =>
        previous?.map((item) =>
          item.section === section ? { ...item, isVisible: !item.isVisible } : item
        ) ?? previous
    )
  }

  const handleSave = () => {
    if (!items) return
    reorderMutation.mutate(
      items.map((item, index) => ({
        section: item.section,
        order: index,
        isVisible: item.isVisible,
      }))
    )
  }

  const handleDiscard = () => {
    if (data) setItems(normalize(data))
  }

  const handleRemove = (section: string) => {
    if (confirm(`Remove the "${sectionLabel(section)}" block from the homepage?`)) {
      removeMutation.mutate(section)
    }
  }

  const editingBlock = items?.find((item) => item.section === editingSection) ?? null

  const usedSlots = new Set(
    (items ?? []).filter((item) => isAdSection(item.section)).map((item) => item.section.slice(3))
  )
  const availableSlots = AD_SLOTS.filter((slot) => !usedSlots.has(slot))

  const isSavingLayout = reorderMutation.isLoading
  const isMutatingStructure = addMutation.isLoading || removeMutation.isLoading
  const hiddenCount = (items ?? []).filter((item) => !item.isVisible).length

  if (isLoading || !items) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-whisky-500" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="card text-center">
        <p className="text-sm text-charcoal-600">
          Couldn&apos;t load the homepage layout. Check the API is running, then retry.
        </p>
        <button
          type="button"
          onClick={() => queryClient.invalidateQueries('homepage')}
          className="btn-secondary mt-4"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Builder */}
      <div className="xl:col-span-5">
        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="section-title">Blocks</h2>
              <p className="section-description">
                Drag to reorder. {hiddenCount > 0 ? `${hiddenCount} hidden.` : 'All visible.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openPromoEditor}
                disabled={promoLoading}
                className="btn-secondary"
                title="Edit the site-wide promo band shown on every page"
              >
                {promoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Megaphone className="h-4 w-4" />
                )}
                Site promo
              </button>

              <button
                type="button"
                onClick={openFooterEditor}
                disabled={footerLoading}
                className="btn-secondary"
                title="Edit the site footer text"
              >
                {footerLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PanelBottom className="h-4 w-4" />
                )}
                Footer
              </button>

              <AddBlockMenu
                open={addOpen}
                onOpenChange={setAddOpen}
                availableSlots={availableSlots}
                disabled={isDirty || isMutatingStructure}
                disabledReason={isDirty ? 'Save or discard your layout changes first' : undefined}
                onAddSlot={(slot) => {
                  setAddOpen(false)
                  addMutation.mutate({ section: `ad:${slot}`, content: { slot } })
                }}
                onAddRichText={() => {
                  setAddOpen(false)
                  addMutation.mutate({
                    section: nextRichTextKey(items.map((item) => item.section)),
                    content: {},
                  })
                }}
              />
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.section)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="mt-4 space-y-2">
                {items.map((block) => (
                  <SortableRow
                    key={block.section}
                    block={block}
                    canRemove={!isCoreSection(block.section)}
                    removeDisabled={isDirty || isMutatingStructure}
                    onToggle={() => toggleVisibility(block.section)}
                    onEdit={() => setEditingSection(block.section)}
                    onRemove={() => handleRemove(block.section)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          {/* Save bar */}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-charcoal-200 pt-4">
            <p className="text-xs text-charcoal-500">
              {isDirty ? 'Unsaved layout changes' : 'Layout is up to date'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="btn-secondary"
                disabled={!isDirty || isSavingLayout}
              >
                <RotateCcw className="h-4 w-4" />
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary"
                disabled={!isDirty || isSavingLayout}
              >
                {isSavingLayout ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSavingLayout ? 'Saving…' : 'Save layout'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="xl:col-span-7">
        <div className="xl:sticky xl:top-6 xl:h-[calc(100vh-7rem)]">
          <SitePreview refreshToken={refreshToken} />
        </div>
      </div>

      <Modal
        isOpen={!!editingBlock}
        onClose={() => setEditingSection(null)}
        title={editingBlock ? `Edit — ${sectionLabel(editingBlock.section)}` : 'Edit section'}
        size="lg"
      >
        {editingBlock ? (
          <SectionEditor
            // Remount when switching blocks so react-hook-form re-seeds defaults.
            key={editingBlock.section}
            block={editingBlock}
            takenSections={items.map((item) => item.section)}
            isSaving={updateMutation.isLoading || reslotMutation.isLoading}
            onCancel={() => setEditingSection(null)}
            onSubmit={({ content, nextSection }) => {
              if (nextSection === editingBlock.section) {
                updateMutation.mutate({ section: editingBlock.section, content })
              } else {
                reslotMutation.mutate({
                  from: editingBlock.section,
                  to: nextSection,
                  content,
                  order: editingBlock.order,
                })
              }
            }}
          />
        ) : null}
      </Modal>

      <Modal
        isOpen={!!footerBlock}
        onClose={() => setFooterBlock(null)}
        title={`Edit — ${sectionLabel('site_footer')}`}
        size="lg"
      >
        {footerBlock ? (
          <SectionEditor
            key="site_footer"
            block={footerBlock}
            takenSections={items.map((item) => item.section)}
            isSaving={saveFooterMutation.isLoading}
            onCancel={() => setFooterBlock(null)}
            onSubmit={({ content }) => saveFooterMutation.mutate(content)}
          />
        ) : null}
      </Modal>

      <Modal
        isOpen={!!promoBlock}
        onClose={() => setPromoBlock(null)}
        title={`Edit — ${sectionLabel('site_promo')}`}
        size="lg"
      >
        {promoBlock ? (
          <SectionEditor
            key="site_promo"
            block={promoBlock}
            takenSections={items.map((item) => item.section)}
            isSaving={savePromoMutation.isLoading}
            onCancel={() => setPromoBlock(null)}
            onSubmit={({ content }) => savePromoMutation.mutate(content)}
          />
        ) : null}
      </Modal>
    </div>
  )
}

interface SortableRowProps {
  block: HomepageBlock
  canRemove: boolean
  removeDisabled: boolean
  onToggle: () => void
  onEdit: () => void
  onRemove: () => void
}

function SortableRow({
  block,
  canRemove,
  removeDisabled,
  onToggle,
  onEdit,
  onRemove,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.section })

  const label = sectionLabel(block.section)
  const core = isCoreSection(block.section)
  const ad = isAdSection(block.section)

  return (
    <li
      ref={setNodeRef}
      style={{
        // Translate only, and pin x to 0: this list is vertical, and dragging
        // sideways just detaches the row from the column it belongs to.
        // (@dnd-kit/modifiers isn't a dependency of this app.)
        transform: CSS.Translate.toString(transform ? { ...transform, x: 0 } : null),
        transition,
        zIndex: isDragging ? 10 : undefined,
        position: 'relative',
      }}
      className={joinClasses(
        'flex items-center gap-2 rounded-2xl border bg-white p-3 transition-shadow',
        isDragging
          ? 'border-whisky-300 opacity-90 shadow-card-hover'
          : 'border-charcoal-200 shadow-sm',
        !block.isVisible && !isDragging && 'border-dashed bg-charcoal-50/60'
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="cursor-grab touch-none rounded-lg p-1.5 text-charcoal-400 transition-colors hover:bg-charcoal-100 hover:text-charcoal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-whisky-500 active:cursor-grabbing"
        aria-label={`Reorder ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className={joinClasses('min-w-0 flex-1', !block.isVisible && 'opacity-60')}>
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink">{label}</span>
          {core ? <span className="pill">Core</span> : null}
          {ad ? <span className="pill-gold">Ad</span> : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-charcoal-500">{sectionSummary(block)}</p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-label={block.isVisible ? `Hide ${label}` : `Show ${label}`}
        aria-pressed={!block.isVisible}
        title={block.isVisible ? 'Visible on the site' : 'Hidden from the site'}
        className={joinClasses(
          'rounded-lg p-2 transition-colors',
          block.isVisible
            ? 'text-charcoal-500 hover:bg-charcoal-100 hover:text-ink'
            : 'text-status-warning hover:bg-status-warningSoft'
        )}
      >
        {block.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>

      <button type="button" onClick={onEdit} className="btn-ghost">
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>

      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={removeDisabled}
          aria-label={`Remove ${label}`}
          title={removeDisabled ? 'Save or discard your layout changes first' : `Remove ${label}`}
          className="rounded-lg p-2 text-charcoal-400 transition-colors hover:bg-status-dangerSoft hover:text-status-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-charcoal-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </li>
  )
}

interface AddBlockMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableSlots: readonly AdSlot[]
  disabled: boolean
  disabledReason?: string
  onAddSlot: (slot: AdSlot) => void
  onAddRichText: () => void
}

/**
 * Add menu: an ad block for any free slot, plus a text/CTA block (always
 * available — text blocks aren't slot-limited). Fixed, seeded sections
 * (banner, featured rails) can't be added here — they always exist.
 */
function AddBlockMenu({
  open,
  onOpenChange,
  availableSlots,
  disabled,
  disabledReason,
  onAddSlot,
  onAddRichText,
}: AddBlockMenuProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        disabled={disabled}
        className="btn-secondary"
        title={disabledReason ?? 'Add a block'}
      >
        <Plus className="h-4 w-4" />
        Add block
      </button>

      {open && !disabled ? (
        <>
          {/* Click-away catcher */}
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => onOpenChange(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-60 rounded-2xl border border-charcoal-200 bg-white p-2 shadow-lifted">
            {availableSlots.length > 0 ? (
              <>
                <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                  Ad slot
                </p>
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onAddSlot(slot)}
                    className="block w-full rounded-xl px-2 py-2 text-left text-sm text-charcoal-700 transition-colors hover:bg-charcoal-50 hover:text-ink"
                  >
                    {AD_SLOT_LABELS[slot]}
                  </button>
                ))}
              </>
            ) : (
              <p className="px-2 py-1.5 text-xs text-charcoal-400">Every ad slot is on the page.</p>
            )}

            <p className="mt-1 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-charcoal-400">
              Content
            </p>
            <button
              type="button"
              onClick={onAddRichText}
              className="block w-full rounded-xl px-2 py-2 text-left text-sm text-charcoal-700 transition-colors hover:bg-charcoal-50 hover:text-ink"
            >
              Text / CTA block
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}

/** First text block is `rich_text`; extras are `rich_text:2`, `rich_text:3`, … */
function nextRichTextKey(sections: string[]): string {
  if (!sections.includes('rich_text')) return 'rich_text'
  let n = 2
  while (sections.includes(`rich_text:${n}`)) n++
  return `rich_text:${n}`
}

function joinClasses(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
