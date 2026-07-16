'use client'

import { useParams } from 'next/navigation'
import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import { Distillery } from '@/lib/types'
import { AdminDetailNav } from '@/components/AdminDetailNav'
import { DistilleryForm } from '@/components/DistilleryForm'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function DistilleryDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data: distillery, isLoading } = useQuery(
    ['distillery', id],
    () => api.get(`/distilleries/${id}`).then(res => res.data)
  )

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!distillery) {
    return <div className="text-center py-12 text-gray-500">Distillery not found</div>
  }

  return (
    <div className="space-y-6">
      <AdminDetailNav id={id} type="distilleries" name={distillery.name} isActive={distillery.isActive !== false} />
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Distillery Details</h2>
        <DistilleryForm distillery={distillery} onSuccess={() => {}} onCancel={() => {}} />
      </div>
    </div>
  )
}
