'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import { AdminDetailNav } from '@/components/AdminDetailNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ListingMediaManager } from '@/components/ListingMediaManager'

export default function DistilleryMediaPage() {
  const params = useParams()
  const id = params.id as string
  const [uploading, setUploading] = useState(false)

  const { data: distillery, isLoading, refetch: refetchDistillery } = useQuery(
    ['distillery', id],
    () => api.get(`/distilleries/${id}`).then((res) => res.data),
  )

  const { data: images = [], isLoading: imagesLoading, refetch } = useQuery(
    ['distillery-media', id],
    () => api.get(`/distilleries/${id}/media`).then((res) => res.data || []),
  )

  if (isLoading) return <LoadingSpinner />
  if (!distillery) return <div className="text-center py-12 text-gray-500">Distillery not found</div>

  return (
    <div className="space-y-6">
      <AdminDetailNav id={id} type="distilleries" name={distillery.name} />
      <ListingMediaManager
        entity={distillery}
        type="distilleries"
        label="distillery"
        images={images}
        imagesLoading={imagesLoading}
        uploading={uploading}
        setUploading={setUploading}
        refetchImages={refetch}
        refetchEntity={refetchDistillery}
      />
    </div>
  )
}
