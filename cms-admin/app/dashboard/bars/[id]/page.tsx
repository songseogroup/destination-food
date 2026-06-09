'use client'

import { useParams } from 'next/navigation'
import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import { Bar } from '@/lib/types'
import { AdminDetailNav } from '@/components/AdminDetailNav'
import { BarForm } from '@/components/BarForm'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function BarDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data: bar, isLoading } = useQuery(
    ['bar', id],
    () => api.get(`/bars/${id}`).then(res => res.data)
  )

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!bar) {
    return <div className="text-center py-12 text-gray-500">Bar not found</div>
  }

  return (
    <div className="space-y-6">
      <AdminDetailNav id={id} type="bars" name={bar.name} />
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Bar Details</h2>
        <BarForm bar={bar} onSuccess={() => {}} onCancel={() => {}} />
      </div>
    </div>
  )
}
