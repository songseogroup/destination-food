'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { X, Plus, Save } from 'lucide-react'
import { api } from '@/lib/api'
import { Bar } from '@/lib/types'
import { SocialLinksField, SocialLink, cleanSocialLinks } from '@/components/SocialLinksField'
import toast from 'react-hot-toast'

interface BarFormProps {
  bar?: Bar | null
  onSuccess: () => void
  onCancel: () => void
}

interface BarFormData {
  name: string
  type: string
  location: string
  image: string
  priceRange: string
  specialties: string[]
  products: string[]
  mediaGallery: string[]
  description: string
  address: string
  phone: string
  website: string
  socialLinks: SocialLink[]
  isOpen: boolean
  isActive: boolean
  bookingDepositPerGuest?: number | null
  refundWindowHours?: number | null
}

/**
 * What actually goes over the wire. `website` is optional here because the
 * backend's @IsOptional() only skips null/undefined — an empty string still
 * reaches @IsUrl() and 400s the whole request, so we omit it instead.
 */
type BarSubmitData = Omit<BarFormData, 'website'> & { website?: string }

export function BarForm({ bar, onSuccess, onCancel }: BarFormProps) {
  const [specialties, setSpecialties] = useState<string[]>(bar?.specialties || [])
  const [products, setProducts] = useState<string[]>(bar?.products || [])
  const [newSpecialty, setNewSpecialty] = useState('')
  const [newProduct, setNewProduct] = useState('')
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<BarFormData>({
    defaultValues: {
      name: bar?.name || '',
      type: bar?.type || '',
      location: bar?.location || '',
      image: bar?.image || '',
      priceRange: bar?.priceRange || '',
      description: bar?.description || '',
      address: bar?.address || '',
      phone: bar?.phone || '',
      website: bar?.website || '',
      // Not on the Bar type in lib/types.ts yet, hence the cast — same pattern
      // as bookingDepositPerGuest below.
      socialLinks: ((bar as any)?.socialLinks as SocialLink[]) ?? [],
      isOpen: bar?.isOpen || true,
      isActive: bar?.isActive || true,
      bookingDepositPerGuest: (bar as any)?.bookingDepositPerGuest ?? null,
      refundWindowHours: (bar as any)?.refundWindowHours ?? 48,
    }
  })
  const isOpen = watch('isOpen')
  const isPublished = watch('isActive')

  const createMutation = useMutation(
    (data: BarSubmitData) => api.post('/bars', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bars')
        onSuccess()
      },
      onError: () => {
        toast.error('Failed to create bar')
      },
    }
  )

  const updateMutation = useMutation(
    (data: BarSubmitData) => api.patch(`/bars/${bar?.id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bars')
        onSuccess()
      },
      onError: () => {
        toast.error('Failed to update bar')
      },
    }
  )

  const addSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()])
      setNewSpecialty('')
    }
  }

  const addProduct = () => {
    if (newProduct.trim() && !products.includes(newProduct.trim())) {
      setProducts([...products, newProduct.trim()])
      setNewProduct('')
    }
  }

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
  }

  const removeSpecialty = (index: number) => {
    setSpecialties(specialties.filter((_, i) => i !== index))
  }

  const onSubmit = (data: BarFormData) => {
    const website = data.website?.trim()
    const submitData: BarSubmitData = {
      ...data,
      specialties,
      products,
      mediaGallery: bar?.mediaGallery || [],
      socialLinks: cleanSocialLinks(data.socialLinks),
      website: website ? website : undefined,
    }

    if (bar) {
      updateMutation.mutate(submitData)
    } else {
      createMutation.mutate(submitData)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Basic Information */}
        <div className="form-section space-y-5">
          <div>
            <h3 className="section-title">Business Profile</h3>
            <p className="section-description">Core information customers see on the marketplace listing.</p>
          </div>
          
          <div>
            <label className="label">Bar Name *</label>
            <input
              {...register('name', { required: 'Bar name is required' })}
              className="input-field"
              placeholder="Enter bar name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Type *</label>
            <select {...register('type', { required: 'Type is required' })} className="input-field">
              <option value="">Select type</option>
              <option value="Cocktail Bar">Cocktail Bar</option>
              <option value="Speakeasy">Speakeasy</option>
              <option value="Rooftop Bar">Rooftop Bar</option>
              <option value="Whiskey Bar">Whiskey Bar</option>
              <option value="Nightclub">Nightclub</option>
              <option value="Wine Bar">Wine Bar</option>
              <option value="Sports Bar">Sports Bar</option>
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
          </div>

          <div>
            <label className="label">Location *</label>
            <input
              {...register('location', { required: 'Location is required' })}
              className="input-field"
              placeholder="Enter location"
            />
            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
          </div>

          <div>
            <label className="label">Price Range *</label>
            <select {...register('priceRange', { required: 'Price range is required' })} className="input-field">
              <option value="">Select price range</option>
              <option value="$">$ - Budget</option>
              <option value="$$">$$ - Moderate</option>
              <option value="$$$">$$$ - Expensive</option>
              <option value="$$$$">$$$$ - Very Expensive</option>
            </select>
            {errors.priceRange && <p className="text-red-500 text-sm mt-1">{errors.priceRange.message}</p>}
          </div>

          <div>
            <label className="label">Reservation deposit per guest</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                {...register('bookingDepositPerGuest', {
                  setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                })}
                type="number"
                step="0.5"
                min="0"
                className="input-field pl-7"
                placeholder="0 = no deposit"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave blank or 0 for free reservations. If set, customers pay this amount × guests upfront via card.
            </p>
          </div>

          <div>
            <label className="label">Refund window (hours before booking)</label>
            <input
              {...register('refundWindowHours', {
                setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
              })}
              type="number"
              step="1"
              min="0"
              className="input-field"
              placeholder="48"
            />
            <p className="text-xs text-gray-500 mt-1">
              Customers can self-refund up until this many hours before their booking. Owner-initiated cancellations always refund automatically.
            </p>
          </div>
        </div>

        {/* Image and Status */}
        <div className="form-section space-y-5">
          <div>
            <h3 className="section-title">Publishing</h3>
            <p className="section-description">Control whether this listing is visible and currently open.</p>
          </div>

          <input {...register('isOpen')} type="checkbox" className="hidden" />
          <input {...register('isActive')} type="checkbox" className="hidden" />

          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <ToggleRow
              label="Currently open"
              description="Show the venue as open for customers."
              checked={!!isOpen}
              onChange={() => setValue('isOpen', !isOpen, { shouldDirty: true })}
            />
            <div className="border-t border-gray-200" />
            <ToggleRow
              label="Published"
              description="Make this listing visible on the marketplace."
              checked={!!isPublished}
              onChange={() => setValue('isActive', !isPublished, { shouldDirty: true })}
            />
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="form-section">
        <div className="mb-5">
          <h3 className="section-title">Positioning</h3>
          <p className="section-description">Use short tags that help customers understand the venue and offering.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Specialties</p>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              placeholder="Add specialty"
              className="input-field flex-1"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
            />
            <button
              type="button"
              onClick={addSpecialty}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
              >
                {specialty}
                <button
                  type="button"
                  onClick={() => removeSpecialty(index)}
                  className="ml-2 text-gray-500 hover:text-gray-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Products</p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                placeholder="Add product"
                className="input-field flex-1"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct())}
              />
              <button
                type="button"
                onClick={addProduct}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {products.map((product, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
                >
                  {product}
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="ml-2 text-gray-500 hover:text-gray-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="form-section space-y-4">
        <div>
          <h3 className="section-title">Contact & Details</h3>
          <p className="section-description">Keep operational contact information accurate for customers and support.</p>
        </div>
        
        <div>
          <label className="label">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="input-field"
            placeholder="Enter bar description"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Address</label>
            <input
              {...register('address')}
              className="input-field"
              placeholder="Enter full address"
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              {...register('phone')}
              className="input-field"
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <div>
          <label className="label">Website</label>
          <input
            {...register('website')}
            type="url"
            className="input-field"
            placeholder="https://example.com"
          />
        </div>
      </div>

      {/* Social & Links */}
      <div className="form-section space-y-4">
        <div>
          <h3 className="section-title">Social & Links</h3>
          <p className="section-description">
            Social profiles and any other pages worth linking. The website above stays the primary site.
          </p>
        </div>

        <Controller
          control={control}
          name="socialLinks"
          render={({ field }) => (
            <SocialLinksField value={field.value ?? []} onChange={field.onChange} />
          )}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createMutation.isLoading || updateMutation.isLoading}
          className="btn-primary"
        >
          <Save className="h-4 w-4" />
          {createMutation.isLoading || updateMutation.isLoading
            ? 'Saving...'
            : bar
            ? 'Update Bar'
            : 'Create Bar'}
        </button>
      </div>
    </form>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/20 ${
          checked ? 'bg-gray-900' : 'bg-gray-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
