'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarForm } from '@/components/BarForm'
import { ArrowLeft } from 'lucide-react'

export default function NewBarPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/dashboard/bars')
  }

  const handleCancel = () => {
    router.push('/dashboard/bars')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bars" className="text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Bar</h1>
          <p className="text-gray-600">Add a new bar to the platform</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <BarForm bar={null} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
