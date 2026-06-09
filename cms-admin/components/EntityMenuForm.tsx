'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from 'react-query'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { AdminDetailNav } from '@/components/AdminDetailNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface MenuItem {
  id: number
  name: string
  description?: string
  price: number
  category: string
  isAvailable: boolean
}

interface EntityMenuFormProps {
  type: 'bars' | 'distilleries'
  mode: 'new' | 'edit'
}

const CATEGORY_OPTIONS = {
  bars: [
    { value: 'beverage', label: 'Beverage' },
    { value: 'food', label: 'Food' },
    { value: 'appetizer', label: 'Appetizer' },
    { value: 'dessert', label: 'Dessert' },
  ],
  distilleries: [
    { value: 'spirit', label: 'Spirit' },
    { value: 'wine', label: 'Wine' },
    { value: 'beer', label: 'Beer' },
    { value: 'liqueur', label: 'Liqueur' },
    { value: 'other', label: 'Other' },
  ],
}

export function EntityMenuForm({ type, mode }: EntityMenuFormProps) {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const itemId = params.itemId as string | undefined
  const entityKey = type === 'distilleries' ? 'distillery' : 'bar'
  const entityLabel = type === 'bars' ? 'Bar' : 'Distillery'
  const itemLabel = type === 'bars' ? 'Menu Item' : 'Product'
  const defaultCategory = type === 'bars' ? 'beverage' : 'spirit'

  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [itemCategory, setItemCategory] = useState(defaultCategory)
  const [itemDescription, setItemDescription] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)

  const { data: entity, isLoading: entityLoading } = useQuery(
    [entityKey, id],
    () => api.get(`/${type}/${id}`).then((res) => res.data),
  )

  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>(
    [`${type}-menu`, id],
    () => api.get(`/${type}/${id}/menu`).then((res) => res.data || []),
    { enabled: mode === 'edit' },
  )

  const currentItem = useMemo(
    () => menuItems.find((item) => item.id.toString() === itemId),
    [itemId, menuItems],
  )

  useEffect(() => {
    if (!currentItem) return
    setItemName(currentItem.name)
    setItemPrice(currentItem.price.toString())
    setItemCategory(currentItem.category || defaultCategory)
    setItemDescription(currentItem.description || '')
    setIsAvailable(currentItem.isAvailable)
  }, [currentItem, defaultCategory])

  const saveMutation = useMutation(
    (data: Omit<MenuItem, 'id'>) => {
      if (mode === 'edit') {
        return api.patch(`/${type}/${id}/menu/${itemId}`, data)
      }
      return api.post(`/${type}/${id}/menu`, data)
    },
    {
      onSuccess: () => {
        toast.success(`${itemLabel} ${mode === 'edit' ? 'updated' : 'created'} successfully`)
        router.push(`/dashboard/${type}/${id}/menu`)
      },
      onError: () => {
        toast.error(`Failed to save ${itemLabel.toLowerCase()}`)
      },
    },
  )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!itemName.trim() || !itemPrice) {
      toast.error('Please fill in all required fields')
      return
    }

    saveMutation.mutate({
      name: itemName.trim(),
      price: parseFloat(itemPrice),
      category: itemCategory,
      description: itemDescription.trim(),
      isAvailable,
    })
  }

  if (entityLoading || (mode === 'edit' && menuLoading)) return <LoadingSpinner />
  if (!entity) return <div className="text-center py-12 text-gray-500">{entityLabel} not found</div>
  if (mode === 'edit' && !currentItem) {
    return <div className="text-center py-12 text-gray-500">{itemLabel} not found</div>
  }

  return (
    <div className="space-y-6">
      <AdminDetailNav id={id} type={type} name={entity.name} />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/dashboard/${type}/${id}/menu`}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to menu
              </Link>
              <h2 className="mt-3 text-xl font-semibold text-gray-900">
                {mode === 'edit' ? `Edit ${itemLabel}` : `Create ${itemLabel}`}
              </h2>
            </div>
            <button
              type="submit"
              disabled={saveMutation.isLoading}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">{itemLabel} Name *</label>
              <input
                type="text"
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                className="input-field"
                placeholder={type === 'bars' ? 'Smoked Old Fashioned' : 'Single Malt Tasting'}
              />
            </div>
            <div>
              <label className="label">Price *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={itemPrice}
                onChange={(event) => setItemPrice(event.target.value)}
                className="input-field"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={itemCategory}
                onChange={(event) => setItemCategory(event.target.value)}
                className="input-field"
              >
                {CATEGORY_OPTIONS[type].map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                value={itemDescription}
                onChange={(event) => setItemDescription(event.target.value)}
                className="input-field min-h-[140px]"
                placeholder="Short customer-facing description"
              />
            </div>
            <label className="md:col-span-2 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-gray-900">Available for customers</span>
                <span className="block text-xs text-gray-500">Hidden items stay in CMS but will not be sold.</span>
              </span>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(event) => setIsAvailable(event.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </form>

        <aside className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 h-fit">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Preview</p>
          <div className="mt-4 rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">{itemName || itemLabel}</h3>
                <p className="mt-1 text-sm text-gray-500">{itemCategory}</p>
              </div>
              <span className="font-semibold text-gray-900">
                ${Number(itemPrice || 0).toFixed(2)}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              {itemDescription || 'Description will appear here as you write it.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
