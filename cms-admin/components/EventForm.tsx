'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQueryClient } from 'react-query'
import { Upload } from 'lucide-react'
import { api } from '@/lib/api'
import { Event } from '@/lib/types'
import { SocialLinksField, SocialLink, cleanSocialLinks } from '@/components/SocialLinksField'
import toast from 'react-hot-toast'

interface EventFormProps {
  event?: Event | null
  onSuccess: () => void
  onCancel: () => void
}

interface EventFormData {
  refundWindowHours: number | null
  name: string
  type: string
  date: string
  time: string
  location: string
  image: string
  price: string
  capacity: string
  description: string
  category: string
  fullDescription: string
  organizer: string
  contactEmail: string
  contactPhone: string
  website: string
  socialLinks: SocialLink[]
  requirements: string[]
  isActive: boolean
  isFeatured: boolean
}

/**
 * What actually goes over the wire. `website` (@IsUrl) and `contactEmail`
 * (@IsEmail) are optional here because the backend's @IsOptional() only skips
 * null/undefined — an empty string still hits the validator and 400s the whole
 * request, so we omit them instead.
 */
type EventSubmitData = Omit<EventFormData, 'website' | 'contactEmail'> & {
  website?: string
  contactEmail?: string
}

export function EventForm({ event, onSuccess, onCancel }: EventFormProps) {
  const [requirements, setRequirements] = useState<string[]>(event?.requirements || [])
  const [newRequirement, setNewRequirement] = useState('')
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<EventFormData>({
    defaultValues: {
      refundWindowHours: event?.refundWindowHours ?? 48,
      name: event?.name || '',
      type: event?.type || '',
      date: event?.date || '',
      time: event?.time || '',
      location: event?.location || '',
      image: event?.image || '',
      price: event?.price || '',
      capacity: event?.capacity || '',
      description: event?.description || '',
      category: event?.category || '',
      fullDescription: event?.fullDescription || '',
      organizer: event?.organizer || '',
      contactEmail: event?.contactEmail || '',
      contactPhone: event?.contactPhone || '',
      // Neither is on the Event type in lib/types.ts yet, hence the casts.
      website: ((event as any)?.website as string) || '',
      socialLinks: ((event as any)?.socialLinks as SocialLink[]) ?? [],
      isActive: event?.isActive || true,
      isFeatured: event?.isFeatured || false,
    }
  })

  const createMutation = useMutation(
    (data: EventSubmitData) => api.post('/events', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('events')
        onSuccess()
      },
      onError: () => {
        toast.error('Failed to create event')
      },
    }
  )

  const updateMutation = useMutation(
    (data: EventSubmitData) => api.patch(`/events/${event?.id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('events')
        onSuccess()
      },
      onError: () => {
        toast.error('Failed to update event')
      },
    }
  )

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      setValue('image', response.data.url)
      toast.success('Image uploaded successfully')
    } catch (error) {
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const addRequirement = () => {
    if (newRequirement.trim() && !requirements.includes(newRequirement.trim())) {
      setRequirements([...requirements, newRequirement.trim()])
      setNewRequirement('')
    }
  }

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index))
  }

  const onSubmit = (data: EventFormData) => {
    const website = data.website?.trim()
    const contactEmail = data.contactEmail?.trim()
    const submitData: EventSubmitData = {
      ...data,
      requirements,
      socialLinks: cleanSocialLinks(data.socialLinks),
      website: website ? website : undefined,
      contactEmail: contactEmail ? contactEmail : undefined,
    }

    if (event) {
      updateMutation.mutate(submitData)
    } else {
      createMutation.mutate(submitData)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          
          <div>
            <label className="label">Event Name *</label>
            <input
              {...register('name', { required: 'Event name is required' })}
              className="input-field"
              placeholder="Enter event name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Event Type *</label>
            <select {...register('type', { required: 'Type is required' })} className="input-field">
              <option value="">Select type</option>
              <option value="Workshop">Workshop</option>
              <option value="Tasting">Tasting</option>
              <option value="Live Music">Live Music</option>
              <option value="Social Event">Social Event</option>
              <option value="Festival">Festival</option>
              <option value="Masterclass">Masterclass</option>
              <option value="Tour">Tour</option>
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
          </div>

          <div>
            <label className="label">Category *</label>
            <select {...register('category', { required: 'Category is required' })} className="input-field">
              <option value="">Select category</option>
              <option value="Education">Education</option>
              <option value="Tasting">Tasting</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Social">Social</option>
              <option value="Festival">Festival</option>
              <option value="Networking">Networking</option>
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input
                {...register('date', { required: 'Date is required' })}
                type="date"
                className="input-field"
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
            </div>
            <div>
              <label className="label">Time *</label>
              <input
                {...register('time', { required: 'Time is required' })}
                type="time"
                className="input-field"
              />
              {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Location *</label>
            <input
              {...register('location', { required: 'Location is required' })}
              className="input-field"
              placeholder="Enter event location"
            />
            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
          </div>
        </div>

        {/* Pricing and Capacity */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Pricing & Capacity</h3>
          
          <div>
            <label className="label">Event Image *</label>
            <div className="space-y-2">
              <input
                {...register('image', { required: 'Image is required' })}
                className="input-field"
                placeholder="Image URL or upload file"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                }}
                className="hidden"
                id="event-image-upload"
              />
              <label
                htmlFor="event-image-upload"
                className="btn-secondary cursor-pointer inline-flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </label>
            </div>
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price *</label>
              <input
                {...register('price', { required: 'Price is required' })}
                className="input-field"
                placeholder="e.g., $75, Free"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="label">Capacity *</label>
              <input
                {...register('capacity', { required: 'Capacity is required' })}
                className="input-field"
                placeholder="e.g., 20 people"
              />
              {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity.message}</p>}
            </div>
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
              Guests can cancel for a full refund up until this many hours before the event, and this
              is shown to them at checkout. Your own cancellations always refund automatically.
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                {...register('isActive')}
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center">
              <input
                {...register('isFeatured')}
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Featured Event</span>
            </label>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Short Description *</label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={3}
              className="input-field"
              placeholder="Brief description of the event"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="label">Full Description</label>
            <textarea
              {...register('fullDescription')}
              rows={5}
              className="input-field"
              placeholder="Detailed description of the event"
            />
          </div>
        </div>
      </div>

      {/* Organizer Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Organizer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Organizer</label>
            <input
              {...register('organizer')}
              className="input-field"
              placeholder="Event organizer name"
            />
          </div>
          <div>
            <label className="label">Contact Email</label>
            <input
              {...register('contactEmail')}
              type="email"
              className="input-field"
              placeholder="contact@example.com"
            />
          </div>
          <div>
            <label className="label">Contact Phone</label>
            <input
              {...register('contactPhone')}
              className="input-field"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Social & Links */}
      <div className="form-section space-y-4">
        <div>
          <h3 className="section-title">Social & Links</h3>
          <p className="section-description">
            The event&apos;s primary site, plus social profiles and any other pages worth linking.
          </p>
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

        <Controller
          control={control}
          name="socialLinks"
          render={({ field }) => (
            <SocialLinksField value={field.value ?? []} onChange={field.onChange} />
          )}
        />
      </div>

      {/* Requirements */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Requirements</h3>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="Add requirement"
              className="input-field flex-1"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
            />
            <button
              type="button"
              onClick={addRequirement}
              className="btn-primary"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {requirements.map((requirement, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
              >
                {requirement}
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="ml-2 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
          className="btn-primary disabled:opacity-50"
        >
          {createMutation.isLoading || updateMutation.isLoading
            ? 'Saving...'
            : event
            ? 'Update Event'
            : 'Create Event'}
        </button>
      </div>
    </form>
  )
}
