'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Star } from 'lucide-react'
import { api } from '@/lib/api'
import { Blog } from '@/lib/types'
import { BlogForm } from '@/components/BlogForm'
import { Modal } from '@/components/Modal'
import toast from 'react-hot-toast'

export default function BlogsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: blogsData, isLoading } = useQuery(
    ['blogs', currentPage, searchTerm],
    () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })
      if (searchTerm) {
        return api.get(`/blogs/search?q=${searchTerm}`).then(res => ({ data: res.data, total: res.data.length }))
      }
      return api.get(`/blogs?${params}`).then(res => res.data)
    }
  )

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/blogs/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('blogs')
        toast.success('Blog post deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete blog post')
      },
    }
  )

  const toggleActiveMutation = useMutation(
    ({ id, isActive }: { id: number; isActive: boolean }) => 
      api.patch(`/blogs/${id}`, { isActive: !isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('blogs')
        toast.success('Blog post status updated')
      },
      onError: () => {
        toast.error('Failed to update blog post status')
      },
    }
  )

  const toggleFeaturedMutation = useMutation(
    ({ id, featured }: { id: number; featured: boolean }) => 
      api.patch(`/blogs/${id}`, { featured: !featured }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('blogs')
        toast.success('Blog post featured status updated')
      },
      onError: () => {
        toast.error('Failed to update blog post featured status')
      },
    }
  )

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleToggleActive = (blog: Blog) => {
    toggleActiveMutation.mutate({ id: blog.id, isActive: blog.isActive })
  }

  const handleToggleFeatured = (blog: Blog) => {
    toggleFeaturedMutation.mutate({ id: blog.id, featured: blog.featured })
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingBlog(null)
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries('blogs')
    handleFormClose()
    toast.success(editingBlog ? 'Blog post updated successfully' : 'Blog post created successfully')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-600">Manage blog posts and articles</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Blog Post
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Blogs Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blog Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  </td>
                </tr>
              ) : blogsData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No blog posts found
                  </td>
                </tr>
              ) : (
                blogsData?.data?.map((blog: Blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={blog.image}
                          alt={blog.title}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div className="ml-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                              {blog.title}
                            </div>
                            {blog.featured && (
                              <Star className="h-4 w-4 text-yellow-500 ml-2" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {blog.excerpt}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {blog.author}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                        {blog.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(blog.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {blog.views}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        blog.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {blog.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(blog)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(blog)}
                          className={`${blog.featured ? 'text-yellow-600' : 'text-gray-400'} hover:text-yellow-600`}
                          title={blog.featured ? 'Remove from featured' : 'Add to featured'}
                        >
                          <Star className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(blog)}
                          className="text-gray-600 hover:text-gray-900"
                          title={blog.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {blog.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(blog.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {blogsData?.total > 10 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, blogsData.total)} of {blogsData.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage * 10 >= blogsData.total}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Blog Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleFormClose}
        title={editingBlog ? 'Edit Blog Post' : 'Add New Blog Post'}
        size="xl"
      >
        <BlogForm
          blog={editingBlog}
          onSuccess={handleFormSuccess}
          onCancel={handleFormClose}
        />
      </Modal>
    </div>
  )
}
