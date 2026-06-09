'use client'

import React, { useRef, useState } from 'react'
import { ImagePlus, Trash2, Upload, Play, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

interface ListingMediaManagerProps {
  entity: {
    id: number
    name: string
    image?: string
  }
  type: 'bars' | 'distilleries' | 'events'
  label: string
  images: Array<{
    id: number
    url: string
    caption?: string
    uploadedAt: string
    type?: 'image' | 'video'
  }>
  imagesLoading: boolean
  uploading: boolean
  setUploading: (value: boolean) => void
  refetchImages: () => void
  refetchEntity: () => void
}

export function ListingMediaManager({
  entity,
  type,
  label,
  images,
  imagesLoading,
  uploading,
  setUploading,
  refetchImages,
  refetchEntity,
}: ListingMediaManagerProps) {
  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [coverUploading, setCoverUploading] = useState(false)

  const uploadImage = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.url
  }

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCoverUploading(true)
    try {
      const url = await uploadImage(file)
      await api.patch(`/${type}/${entity.id}`, { image: url })
      toast.success('Cover image updated')
      refetchEntity()
    } catch (error) {
      toast.error('Failed to update cover image')
    } finally {
      setCoverUploading(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append('files', file)
      })

      await api.post(`/${type}/${entity.id}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Media uploaded successfully')
      refetchImages()
    } catch (error) {
      toast.error('Failed to upload media')
    } finally {
      setUploading(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  const handleDelete = async (mediaId: number) => {
    if (!confirm('Delete this media?')) return

    try {
      await api.delete(`/${type}/${entity.id}/media/${mediaId}`)
      toast.success('Media deleted successfully')
      refetchImages()
    } catch (error) {
      toast.error('Failed to delete media')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-950">Cover / Banner</h2>
            <p className="mt-1 text-sm text-gray-600">
              This is the primary image customers see on your marketplace listing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={coverUploading}
            className="btn-secondary"
          >
            <Upload className="h-4 w-4" />
            {coverUploading ? 'Uploading...' : 'Replace Cover'}
          </button>
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverUpload}
          className="hidden"
        />

        <div className="mt-5 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
          {entity.image ? (
            <img src={entity.image} alt={`${entity.name} cover`} className="h-72 w-full object-cover" />
          ) : (
            <div className="flex h-72 items-center justify-center text-sm text-gray-500">
              No cover image set
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-950">Gallery</h2>
            <p className="mt-1 text-sm text-gray-600">Upload and curate supporting images for this {label} profile.</p>
          </div>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary"
          >
            <ImagePlus className="h-5 w-5" />
            {uploading ? 'Uploading...' : 'Upload Images & Videos'}
          </button>
        </div>

        <input
          ref={galleryInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleGalleryUpload}
          className="hidden"
        />

        {imagesLoading ? (
          <div className="text-center py-12 text-gray-500">Loading media...</div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {images.map((media) => {
              const isVideo = media.type === 'video' || media.url.match(/\.(mp4|webm|mov|avi|mkv)$/i)
              return (
                <div key={media.id} className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {isVideo ? (
                    <div className="relative h-56 w-full bg-gray-900">
                      <video
                        src={media.url}
                        className="h-full w-full object-cover"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="rounded-full bg-white/90 p-3">
                          <Play className="h-6 w-6 text-gray-900 fill-current" />
                        </div>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
                          <Video className="h-3 w-3" />
                          VIDEO
                        </span>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={media.url}
                      alt={media.caption || `${label} media`}
                      className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-sm font-medium text-white">{media.caption || (isVideo ? 'Gallery video' : 'Gallery image')}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(media.id)}
                    className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-red-600 opacity-0 shadow-sm transition-opacity hover:bg-red-50 group-hover:opacity-100"
                    title="Delete media"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-6 py-16 text-center">
            <ImagePlus className="h-10 w-10 text-gray-400" />
            <h3 className="mt-4 text-base font-semibold text-gray-900">No gallery media yet</h3>
            <p className="mt-2 max-w-md text-sm text-gray-600">
              Add venue photos, product imagery, ambience shots, promotional visuals, or videos.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
