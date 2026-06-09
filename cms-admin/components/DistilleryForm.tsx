'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from 'react-query'
import { Upload, Plus, X } from 'lucide-react'
import { api } from '@/lib/api'
import { Distillery } from '@/lib/types'
import toast from 'react-hot-toast'

interface DistilleryFormProps {
  distillery?: Distillery | null
  onSuccess: () => void
  onCancel: () => void
}

interface DistilleryFormData {
  name: string
  type: string
  location: string
  image: string
  priceRange: string
  specialties: string[]
  established: string
  description: string
  address: string
  phone: string
  website: string
  operatingHours: Record<string, string>
  products: string[]
  isOpen: boolean
  isActive: boolean
}

export function DistilleryForm({ distillery, onSuccess, onCancel }: DistilleryFormProps) {
  const [specialties, setSpecialties] = useState<string[]>(distillery?.specialties || [])
  const [products, setProducts] = useState<string[]>(distillery?.products || [])
  const [newSpecialty, setNewSpecialty] = useState('')
  const [newProduct, setNewProduct] = useState('')
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<DistilleryFormData>({
    defaultValues: {
      name: distillery?.name || '',
      type: distillery?.type || '',
      location: distillery?.location || '',
      image: distillery?.image || '',
      priceRange: distillery?.priceRange || '',
      established: distillery?.established || '',
      description: distillery?.description || '',
      address: distillery?.address || '',
      phone: distillery?.phone || '',
      website: distillery?.website || '',
      operatingHours: distillery?.operatingHours || {},
      isOpen: distillery?.isOpen || true,
      isActive: distillery?.isActive || true,
    }
  })

  const createMutation = useMutation(
    (data: DistilleryFormData) => api.post('/distilleries', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('distilleries')
        onSuccess()
      },
      onError: () => {
        toast.error('Failed to create distillery')
      },
    }
  )

  const updateMutation = useMutation(
    (data: DistilleryFormData) => api.patch(`/distilleries/${distillery?.id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('distilleries')
        onSuccess()
      },
      onError: () => {
        toast.error('Failed to update distillery')
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

  const addSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()])
      setNewSpecialty('')
    }
  }

  const removeSpecialty = (index: number) => {
    setSpecialties(specialties.filter((_, i) => i !== index))
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

  const onSubmit = (data: DistilleryFormData) => {
    const submitData = {
      ...data,
      specialties,
      products,
    }

    if (distillery) {
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
            <label className="label">Distillery Name *</label>
            <input
              {...register('name', { required: 'Distillery name is required' })}
              className="input-field"
              placeholder="Enter distillery name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Type *</label>
            <select {...register('type', { required: 'Type is required' })} className="input-field">
              <option value="">Select type</option>
              <option value="Whiskey Distillery">Whiskey Distillery</option>
              <option value="Craft Distillery">Craft Distillery</option>
              <option value="Rum Distillery">Rum Distillery</option>
              <option value="Boutique Distillery">Boutique Distillery</option>
              <option value="Hybrid Facility">Hybrid Facility</option>
              <option value="Brandy Distillery">Brandy Distillery</option>
              <option value="Gin Distillery">Gin Distillery</option>
              <option value="Vodka Distillery">Vodka Distillery</option>
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
            <label className="label">Established Year *</label>
            <input
              {...register('established', { required: 'Established year is required' })}
              className="input-field"
              placeholder="e.g., 1892"
            />
            {errors.established && <p className="text-red-500 text-sm mt-1">{errors.established.message}</p>}
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
        </div>

        {/* Image and Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Image & Status</h3>
          
          <div>
            <label className="label">Distillery Image *</label>
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
                id="distillery-image-upload"
              />
              <label
                htmlFor="distillery-image-upload"
                className="btn-secondary cursor-pointer inline-flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </label>
            </div>
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                {...register('isOpen')}
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Currently Open</span>
            </label>
            <label className="flex items-center">
              <input
                {...register('isActive')}
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Specialties</h3>
        <div className="space-y-3">
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
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
              >
                {specialty}
                <button
                  type="button"
                  onClick={() => removeSpecialty(index)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Products</h3>
        <div className="space-y-3">
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
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
              >
                {product}
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
        
        <div>
          <label className="label">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="input-field"
            placeholder="Enter distillery description"
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
            : distillery
            ? 'Update Distillery'
            : 'Create Distillery'}
        </button>
      </div>
    </form>
  )
}
