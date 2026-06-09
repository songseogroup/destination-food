'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from 'react-query'
import { Upload, Plus, X } from 'lucide-react'
import { api } from '@/lib/api'
import { Blog } from '@/lib/types'
import toast from 'react-hot-toast'

interface BlogFormProps {
  blog?: Blog | null
  onSuccess: () => void
  onCancel: () => void
}

interface BlogFormData {
  title: string
  excerpt: string
  content: string
  author: string
  date: string
  readTime: string
  category: string
  image: string
  featured: boolean
  isActive: boolean
  tags: string[]
  metaTitle: string
  metaDescription: string
}

export function BlogForm({ blog, onSuccess, onCancel }: BlogFormProps) {
  const [tags, setTags] = useState<string[]>(blog?.tags || [])
  const [newTag, setNewTag] = useState('')
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<BlogFormData>({
    defaultValues: {
      title: blog?.title || '',
      excerpt: blog?.excerpt || '',
      content: blog?.content || '',
      author: blog?.author || '',
      date: blog?.date || new Date().toISOString().split('T')[0],
      readTime: blog?.readTime || '',
      category: blog?.category || '',
      image: blog?.image || '',
      featured: blog?.featured || false,
      isActive: blog?.isActive || true,
      metaTitle: blog?.metaTitle || '',
      metaDescription: blog?.metaDescription || '',
    }
  })

  const createMutation = useMutation(
    (data: BlogFormData) => api.post('/blogs', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('blogs')
        onSuccess()
      },
      onError: () => {
        toast.error('Failed to create blog post')
      },
    }
  )

  const updateMutation = useMutation(
    (data: BlogFormData) => api.patch(`/blogs/${blog?.id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('blogs')
        onSuccess()
      },
      onError: () => {
        toast.error('Failed to update blog post')
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

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  const onSubmit = (data: BlogFormData) => {
    const submitData = {
      ...data,
      tags,
    }

    if (blog) {
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
            <label className="label">Blog Title *</label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="input-field"
              placeholder="Enter blog title"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Author *</label>
            <input
              {...register('author', { required: 'Author is required' })}
              className="input-field"
              placeholder="Enter author name"
            />
            {errors.author && <p className="text-red-500 text-sm mt-1">{errors.author.message}</p>}
          </div>

          <div>
            <label className="label">Category *</label>
            <select {...register('category', { required: 'Category is required' })} className="input-field">
              <option value="">Select category</option>
              <option value="Cocktails">Cocktails</option>
              <option value="Spirits">Spirits</option>
              <option value="Bars">Bars</option>
              <option value="Events">Events</option>
              <option value="Distilleries">Distilleries</option>
              <option value="Nightlife">Nightlife</option>
              <option value="Food Guide">Food Guide</option>
              <option value="Company News">Company News</option>
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Publish Date *</label>
              <input
                {...register('date', { required: 'Date is required' })}
                type="date"
                className="input-field"
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
            </div>
            <div>
              <label className="label">Read Time *</label>
              <input
                {...register('readTime', { required: 'Read time is required' })}
                className="input-field"
                placeholder="e.g., 5 min read"
              />
              {errors.readTime && <p className="text-red-500 text-sm mt-1">{errors.readTime.message}</p>}
            </div>
          </div>
        </div>

        {/* Image and Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Image & Status</h3>
          
          <div>
            <label className="label">Featured Image *</label>
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
                id="blog-image-upload"
              />
              <label
                htmlFor="blog-image-upload"
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
                {...register('featured')}
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Featured Post</span>
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

      {/* Content */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Content</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Excerpt *</label>
            <textarea
              {...register('excerpt', { required: 'Excerpt is required' })}
              rows={3}
              className="input-field"
              placeholder="Brief description of the blog post"
            />
            {errors.excerpt && <p className="text-red-500 text-sm mt-1">{errors.excerpt.message}</p>}
          </div>
          <div>
            <label className="label">Content *</label>
            <textarea
              {...register('content', { required: 'Content is required' })}
              rows={10}
              className="input-field"
              placeholder="Write your blog post content here..."
            />
            {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag"
              className="input-field flex-1"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button
              type="button"
              onClick={addTag}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SEO */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Meta Title</label>
            <input
              {...register('metaTitle')}
              className="input-field"
              placeholder="SEO title for search engines"
            />
          </div>
          <div>
            <label className="label">Meta Description</label>
            <textarea
              {...register('metaDescription')}
              rows={3}
              className="input-field"
              placeholder="SEO description for search engines"
            />
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
            : blog
            ? 'Update Blog Post'
            : 'Create Blog Post'}
        </button>
      </div>
    </form>
  )
}
