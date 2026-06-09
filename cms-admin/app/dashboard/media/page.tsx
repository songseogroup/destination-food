'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { Upload, Trash2, Download, Eye, Search } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { auth } from '@/lib/auth'
import { isOwnerRole, isPlatformRole } from '@/lib/roles'
import { EntityWorkspaceIndex } from '@/components/EntityWorkspaceIndex'

interface MediaFile {
  filename: string
  url: string
  size?: number
  uploadedAt: string
}

export default function MediaPage() {
  const user = auth.getUser()
  if (isOwnerRole(user?.role) || isPlatformRole(user?.role)) {
    return <EntityWorkspaceIndex mode="media" />
  }

  return <PlatformMediaLibrary />
}

function PlatformMediaLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Fetch media files from API
  const { data: mediaFiles = [], isLoading } = useQuery(
    'media-files',
    () => api.get('/upload/media').then(res => res.data),
    {
      onError: () => {
        toast.error('Failed to load media files')
      }
    }
  )

  const uploadMutation = useMutation(
    (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('media-files')
        toast.success('File uploaded successfully')
        setUploading(false)
      },
      onError: () => {
        toast.error('Failed to upload file')
        setUploading(false)
      },
    }
  )

  const deleteMutation = useMutation(
    (publicId: string) => api.delete(`/upload/image/${publicId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('media-files')
        toast.success('File deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete file')
      },
    }
  )

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setUploading(true)
      uploadMutation.mutate(files[0])
    }
  }

  const handleDelete = (filename: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate(filename)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredFiles = mediaFiles.filter((file: MediaFile) =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-600">Manage your uploaded images and files</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-primary disabled:opacity-50"
        >
          <Upload className="h-5 w-5 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Files'}
        </button>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Images</h3>
          <p className="text-gray-600 mb-4">
            Drag and drop files here, or click to select files
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            multiple
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary"
          >
            {uploading ? 'Uploading...' : 'Choose Files'}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Supports: JPG, PNG, GIF, WebP (Max 10MB)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Media Grid */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No files match your search.' : 'Upload your first image to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredFiles.map((file: MediaFile, index: number) => (
              <motion.div
                key={file.filename}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image Preview */}
                <div className="aspect-square bg-gray-100">
                  <img
                    src={file.url}
                    alt={file.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(file.url, '_blank')}
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-primary-600 transition-colors"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = file.url
                        link.download = file.filename
                        link.click()
                      }}
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-primary-600 transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.filename)}
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* File Info */}
                <div className="p-3">
                  <h4 className="text-sm font-medium text-gray-900 truncate" title={file.filename}>
                    {file.filename}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>{file.size ? formatFileSize(file.size) : 'Unknown size'}</span>
                    <span>{formatDate(file.uploadedAt)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-bold text-gray-900">{mediaFiles.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Size</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatFileSize(mediaFiles.reduce((total: number, file: MediaFile) => total + (file.size || 0), 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {mediaFiles.filter((file: MediaFile) => {
                  const fileDate = new Date(file.uploadedAt)
                  const now = new Date()
                  return fileDate.getMonth() === now.getMonth() && fileDate.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
