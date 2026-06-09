'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DistilleryForm } from '@/components/DistilleryForm'
import { ArrowLeft } from 'lucide-react'

export default function NewDistilleryPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/dashboard/distilleries')
  }

  const handleCancel = () => {
    router.push('/dashboard/distilleries')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/distilleries" className="text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Distillery</h1>
          <p className="text-gray-600">Add a new distillery to the platform</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <DistilleryForm distillery={null} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
