'use client'

import { useParams } from 'next/navigation'
import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import { AdminDetailNav } from '@/components/AdminDetailNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { SessionsManager } from '@/components/SessionsManager'

export default function BarSessionsPage() {
  const params = useParams()
  const id = params.id as string

  const { data: entity, isLoading } = useQuery(
    ['bar', id],
    () => api.get(`/bars/${id}`).then((res) => res.data),
  )

  if (isLoading) return <LoadingSpinner />
  if (!entity) return <div className="py-12 text-center text-gray-500">Not found</div>

  return (
    <div className="space-y-6">
      <AdminDetailNav id={id} type="bars" name={entity.name} isActive={entity.isActive !== false} />
      <SessionsManager type="bars" entityId={id} />
    </div>
  )
}
