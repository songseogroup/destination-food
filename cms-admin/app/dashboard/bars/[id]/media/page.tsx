'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import { AdminDetailNav } from '@/components/AdminDetailNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ListingMediaManager } from '@/components/ListingMediaManager'

export default function BarMediaPage() {
  const params = useParams()
  const id = params.id as string
  const [uploading, setUploading] = useState(false)

  const { data: bar, isLoading, refetch: refetchBar } = useQuery(
    ['bar', id],
    () => api.get(`/bars/${id}`).then((res) => res.data),
  )

  const { data: images = [], isLoading: imagesLoading, refetch } = useQuery(
    ['bar-media', id],
    () => api.get(`/bars/${id}/media`).then((res) => res.data || []),
  )

  if (isLoading) return <LoadingSpinner />
  if (!bar) return <div className="text-center py-12 text-gray-500">Bar not found</div>

  return (
    <div className="space-y-6">
      <AdminDetailNav id={id} type="bars" name={bar.name} />
      <ListingMediaManager
        entity={bar}
        type="bars"
        label="bar"
        images={images}
        imagesLoading={imagesLoading}
        uploading={uploading}
        setUploading={setUploading}
        refetchImages={refetch}
        refetchEntity={refetchBar}
      />
    </div>
  )
}
