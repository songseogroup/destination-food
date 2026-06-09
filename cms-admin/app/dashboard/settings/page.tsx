'use client'

import { FormEvent, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, UserPlus, Shield, User, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from 'react-query'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'bar', label: 'Bar Owner' },
  { value: 'distillery', label: 'Distillery Owner' },
  { value: 'tour_operator', label: 'Tour Operator' },
  { value: 'event_host', label: 'Event Host' },
]

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [currentUser, setCurrentUser] = useState(auth.getUser())
  const canInvite = useMemo(
    () => currentUser?.role === 'super_admin',
    [currentUser?.role],
  )

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState('admin')
  const [loading, setLoading] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileFirstName, setProfileFirstName] = useState(currentUser?.firstName || '')
  const [profileLastName, setProfileLastName] = useState(currentUser?.lastName || '')
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '')
  const [pricingForm, setPricingForm] = useState({
    tastingOrBarEventCommissionPercent: 6,
    distilleryTourCommissionPercent: 8,
    festivalCommissionPercent: 5,
    bookingFeeThresholdLow: 50,
    bookingFeeThresholdMid: 150,
    bookingFeeLow: 2,
    bookingFeeMid: 3,
    bookingFeeHigh: 4,
  })

  const { data: pricingConfig } = useQuery(
    'pricing-config',
    async () => (await api.get('/stripe/admin/pricing-config')).data,
    {
      enabled: canInvite,
      onSuccess: (data) => setPricingForm(data),
    },
  )

  const { data: pendingVendors } = useQuery(
    'pending-vendors',
    async () => (await api.get('/users/pending-vendors/list')).data,
    { enabled: canInvite },
  )

  const updatePricingMutation = useMutation(
    async () => (await api.patch('/stripe/admin/pricing-config', pricingForm)).data,
    {
      onSuccess: () => {
        toast.success('Pricing configuration updated')
        queryClient.invalidateQueries('pricing-config')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update pricing')
      },
    },
  )

  const approveVendorMutation = useMutation(
    async (id: number) => (await api.patch(`/users/${id}/approve-vendor`)).data,
    {
      onSuccess: () => {
        toast.success('Vendor approved')
        queryClient.invalidateQueries('pending-vendors')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to approve vendor')
      },
    },
  )

  const rejectVendorMutation = useMutation(
    async (id: number) => (await api.patch(`/users/${id}/reject-vendor`)).data,
    {
      onSuccess: () => {
        toast.success('Vendor rejected')
        queryClient.invalidateQueries('pending-vendors')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to reject vendor')
      },
    },
  )

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault()

    if (!canInvite) {
      toast.error('You are not allowed to invite users')
      return
    }

    setLoading(true)
    try {
      const response = await auth.inviteAdmin({
        email,
        firstName,
        lastName,
        role,
      })
      toast.success(response.message || 'Invite sent successfully')
      setEmail('')
      setFirstName('')
      setLastName('')
      setRole('admin')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault()

    if (!currentUser?.id) {
      toast.error('User not found')
      return
    }

    setProfileLoading(true)
    try {
      const response = await api.patch(`/users/${currentUser.id}`, {
        firstName: profileFirstName,
        lastName: profileLastName,
        email: profileEmail,
      })
      const updatedUser = response.data
      const mergedUser = {
        ...currentUser,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
      }

      const token = auth.getToken()
      if (token) {
        auth.setAuth(token, mergedUser)
      }
      setCurrentUser(mergedUser)
      setIsEditingProfile(false)
      toast.success('Profile updated successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage account and CMS access settings.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-primary-50 rounded-lg">
            <User className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">My Account</h2>
            <p className="text-sm text-gray-600">Current signed-in profile details.</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="label">First Name</label>
            <input
              type="text"
              className="input-field"
              value={profileFirstName}
              onChange={(e) => setProfileFirstName(e.target.value)}
              disabled={!isEditingProfile || profileLoading}
              required
            />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input
              type="text"
              className="input-field"
              value={profileLastName}
              onChange={(e) => setProfileLastName(e.target.value)}
              disabled={!isEditingProfile || profileLoading}
              required
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input-field"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              disabled={!isEditingProfile || profileLoading}
              required
            />
          </div>
          <div>
            <label className="label">Role</label>
            <input type="text" className="input-field bg-gray-50" value={currentUser?.role || 'N/A'} disabled />
          </div>
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            {isEditingProfile ? (
              <>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={profileLoading}
                  onClick={() => {
                    setProfileFirstName(currentUser?.firstName || '')
                    setProfileLastName(currentUser?.lastName || '')
                    setProfileEmail(currentUser?.email || '')
                    setIsEditingProfile(false)
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsEditingProfile(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {canInvite ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <UserPlus className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Invite CMS User</h2>
                <p className="text-sm text-gray-600">
                  User ko email invite milega; wo link se apna password khud set karega.
                </p>
              </div>
            </div>

            <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    className="input-field pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="newuser@byfoods.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  className="input-field"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <Shield className="h-4 w-4 mt-0.5 text-gray-400" />
                  <p>Invite link 24 hours me expire ho jayega.</p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending Invite...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission & Booking Fee Controls</h2>
            <form
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                updatePricingMutation.mutate()
              }}
            >
              {Object.keys(pricingForm).map((key) => (
                <div key={key}>
                  <label className="label">{key}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={(pricingForm as any)[key]}
                    onChange={(e) =>
                      setPricingForm((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                    }
                  />
                </div>
              ))}
              <div className="md:col-span-3 flex justify-end">
                <button className="btn-primary" disabled={updatePricingMutation.isLoading}>
                  {updatePricingMutation.isLoading ? 'Saving...' : 'Save Pricing'}
                </button>
              </div>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pending Vendor Approvals ({pendingVendors?.length || 0})
            </h2>
            {pendingVendors && pendingVendors.length > 0 ? (
              <div className="space-y-3">
                {pendingVendors.map((vendor: any) => (
                  <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {vendor.firstName} {vendor.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {vendor.email} · {vendor.role}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => approveVendorMutation.mutate(vendor.id)}
                        className="px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectVendorMutation.mutate(vendor.id)}
                        className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No vendors pending approval.</p>
            )}
          </motion.div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Management</h2>
      
        </motion.div>
      )}
    </div>
  )
}
