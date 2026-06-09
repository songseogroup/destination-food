'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { Save, Upload, Eye, Edit } from 'lucide-react'
import { api } from '@/lib/api'
import { HomepageContent } from '@/lib/types'
import toast from 'react-hot-toast'

export default function HomepagePage() {
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const queryClient = useQueryClient()

  const { data: homepageContent, isLoading } = useQuery(
    'homepage',
    () => api.get('/homepage').then(res => res.data)
  )

  const updateMutation = useMutation(
    ({ section, content }: { section: string; content: Record<string, any> }) =>
      api.post('/homepage/update', { section, content }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('homepage')
        toast.success('Homepage content updated successfully')
        setEditingSection(null)
      },
      onError: () => {
        toast.error('Failed to update homepage content')
      },
    }
  )

  const handleEdit = (section: HomepageContent) => {
    setEditingSection(section.section)
    setFormData(section.content)
  }

  const handleSave = () => {
    if (editingSection) {
      updateMutation.mutate({
        section: editingSection,
        content: formData,
      })
    }
  }

  const handleCancel = () => {
    setEditingSection(null)
    setFormData({})
  }

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      updateFormData('backgroundImage', response.data.url)
      toast.success('Image uploaded successfully')
    } catch (error) {
      toast.error('Failed to upload image')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Homepage Management</h1>
        <p className="text-gray-600">Manage your homepage content and sections</p>
      </div>

      {/* Homepage Sections */}
      <div className="space-y-6">
        {homepageContent?.map((section: HomepageContent) => (
          <motion.div
            key={section.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {section.section.replace('_', ' ')} Section
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.open('/', '_blank')}
                  className="btn-secondary text-sm"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </button>
                <button
                  onClick={() => handleEdit(section)}
                  className="btn-primary text-sm"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
            </div>

            {editingSection === section.section ? (
              <div className="space-y-4">
                {section.section === 'banner' && (
                  <BannerForm
                    data={formData}
                    onChange={updateFormData}
                    onImageUpload={handleImageUpload}
                  />
                )}
                {section.section === 'featured_bars' && (
                  <SectionForm
                    data={formData}
                    onChange={updateFormData}
                    fields={['title', 'description']}
                  />
                )}
                {section.section === 'featured_distilleries' && (
                  <SectionForm
                    data={formData}
                    onChange={updateFormData}
                    fields={['title', 'description']}
                  />
                )}
                {section.section === 'featured_events' && (
                  <SectionForm
                    data={formData}
                    onChange={updateFormData}
                    fields={['title', 'description']}
                  />
                )}
                {section.section === 'featured_blogs' && (
                  <SectionForm
                    data={formData}
                    onChange={updateFormData}
                    fields={['title', 'description']}
                  />
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isLoading}
                    className="btn-primary"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(section.content).map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="font-medium text-gray-700 w-32 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-gray-900">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Banner Form Component
function BannerForm({ 
  data, 
  onChange, 
  onImageUpload 
}: { 
  data: Record<string, any>
  onChange: (key: string, value: any) => void
  onImageUpload: (file: File) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input
            type="text"
            value={data.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
            className="input-field"
            placeholder="Enter title"
          />
        </div>
        <div>
          <label className="label">Subtitle</label>
          <input
            type="text"
            value={data.subtitle || ''}
            onChange={(e) => onChange('subtitle', e.target.value)}
            className="input-field"
            placeholder="Enter subtitle"
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            value={data.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            rows={3}
            className="input-field"
            placeholder="Enter description"
          />
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="label">Background Image</label>
          <div className="space-y-2">
            <input
              type="text"
              value={data.backgroundImage || ''}
              onChange={(e) => onChange('backgroundImage', e.target.value)}
              className="input-field"
              placeholder="Image URL"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onImageUpload(file)
              }}
              className="hidden"
              id="banner-image-upload"
            />
            <label
              htmlFor="banner-image-upload"
              className="btn-secondary cursor-pointer inline-flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Primary Button Text</label>
            <input
              type="text"
              value={data.primaryButton?.text || ''}
              onChange={(e) => onChange('primaryButton', { ...data.primaryButton, text: e.target.value })}
              className="input-field"
              placeholder="Button text"
            />
          </div>
          <div>
            <label className="label">Primary Button Link</label>
            <input
              type="text"
              value={data.primaryButton?.link || ''}
              onChange={(e) => onChange('primaryButton', { ...data.primaryButton, link: e.target.value })}
              className="input-field"
              placeholder="/bars"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Secondary Button Text</label>
            <input
              type="text"
              value={data.secondaryButton?.text || ''}
              onChange={(e) => onChange('secondaryButton', { ...data.secondaryButton, text: e.target.value })}
              className="input-field"
              placeholder="Button text"
            />
          </div>
          <div>
            <label className="label">Secondary Button Link</label>
            <input
              type="text"
              value={data.secondaryButton?.link || ''}
              onChange={(e) => onChange('secondaryButton', { ...data.secondaryButton, link: e.target.value })}
              className="input-field"
              placeholder="/events"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Generic Section Form Component
function SectionForm({ 
  data, 
  onChange, 
  fields 
}: { 
  data: Record<string, any>
  onChange: (key: string, value: any) => void
  fields: string[]
}) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field}>
          <label className="label capitalize">{field}</label>
          {field === 'description' ? (
            <textarea
              value={data[field] || ''}
              onChange={(e) => onChange(field, e.target.value)}
              rows={3}
              className="input-field"
              placeholder={`Enter ${field}`}
            />
          ) : (
            <input
              type="text"
              value={data[field] || ''}
              onChange={(e) => onChange(field, e.target.value)}
              className="input-field"
              placeholder={`Enter ${field}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
