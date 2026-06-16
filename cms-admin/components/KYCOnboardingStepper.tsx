'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  CreditCard,
  Shield,
  Loader2,
  Upload,
  XCircle
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface StripeAccount {
  id: number
  stripeAccountId: string
  status: 'pending' | 'restricted' | 'enabled' | 'disabled'
  kycStatus: 'not_started' | 'in_progress' | 'pending_verification' | 'verified' | 'rejected'
  businessInfo?: any
  personalInfo?: any
  bankAccount?: any
  verificationDetails?: any
  onboardingLink?: string
  payoutsEnabled: boolean
  chargesEnabled: boolean
}

interface CustomOnboardingFormState {
  business: {
    legalName: string
    businessType: 'company' | 'individual'
    website: string
  }
  representative: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  bank: {
    accountHolderName: string
    bsb: string
    accountNumber: string
  }
}

const steps = [
  { id: 1, name: 'Business Info', icon: Building2, description: 'Basic business information' },
  { id: 2, name: 'Identity Verification', icon: User, description: 'Personal identity details' },
  { id: 3, name: 'Bank Account', icon: CreditCard, description: 'Bank account details' },
  { id: 4, name: 'Verification Status', icon: Shield, description: 'Stripe verification' },
  { id: 5, name: 'Activation', icon: CheckCircle2, description: 'Account activation' },
]

export function KYCOnboardingStepper() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({})
  const [form, setForm] = useState<CustomOnboardingFormState>({
    business: {
      legalName: '',
      businessType: 'company',
      website: '',
    },
    representative: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    bank: {
      accountHolderName: '',
      bsb: '',
      accountNumber: '',
    },
  })
  const queryClient = useQueryClient()

  const { data: accountStatus, isLoading } = useQuery<StripeAccount>(
    'stripe-account-status',
    async () => {
      const response = await api.get('/stripe/connect/account-status')
      return response.data
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  const createAccountMutation = useMutation(
    async () => {
      const response = await api.post('/stripe/connect/ensure-account')
      return response.data
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('stripe-account-status')
        if (data.created) {
          toast.success('Payout account created successfully!')
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create payout account')
      },
    }
  )

  // Auto-create payout account if it doesn't exist on component mount
  useEffect(() => {
    if (!isLoading && !accountStatus) {
      createAccountMutation.mutate()
    }
  }, [isLoading, accountStatus])

  const uploadIdentityDocumentMutation = useMutation(
    async (payload: { side: 'front' | 'back'; file: File }) => {
      const formData = new FormData()
      formData.append('side', payload.side)
      formData.append('file', payload.file)
      const response = await api.post('/stripe/connect/identity-verification', formData)
      return response.data
    },
    {
      onSuccess: (_, variables) => {
        toast.success(`ID ${variables.side === 'front' ? 'front' : 'back'} uploaded`)
        setSelectedFiles((prev) => ({ ...prev, [`identity_${variables.side}`]: null }))
        queryClient.invalidateQueries('stripe-account-status')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to upload ID document')
      },
    },
  )

  const submitCustomOnboardingMutation = useMutation(
    async () => {
      const response = await api.post('/stripe/connect/custom-onboarding', form)
      return response.data
    },
    {
      onSuccess: () => {
        toast.success('Business details submitted. Verification is now in progress.')
        queryClient.invalidateQueries('stripe-account-status')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to submit onboarding details')
      },
    }
  )

  const uploadRequirementDocumentMutation = useMutation(
    async (payload: { requirement: string; file: File }) => {
      const formData = new FormData()
      formData.append('requirement', payload.requirement)
      formData.append('file', payload.file)
      const response = await api.post('/stripe/connect/requirements/upload', formData)
      return response.data
    },
    {
      onSuccess: (_, variables) => {
        toast.success(`Document uploaded for ${variables.requirement}`)
        setSelectedFiles((prev) => ({ ...prev, [variables.requirement]: null }))
        queryClient.invalidateQueries('stripe-account-status')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to upload requirement document')
      },
    }
  )

  useEffect(() => {
    if (!accountStatus) return
    // Map (kycStatus, status) → step. Rejected and verified-but-restricted both
    // surface in Step 4 so the user sees Stripe's disabled reason / requirements.
    const { kycStatus, status } = accountStatus
    if (kycStatus === 'rejected') {
      setCurrentStep(4)
    } else if (kycStatus === 'verified' && status === 'enabled') {
      setCurrentStep(5)
    } else if (kycStatus === 'verified' || kycStatus === 'pending_verification') {
      setCurrentStep(4)
    } else if (kycStatus === 'in_progress') {
      setCurrentStep(2)
    } else if (kycStatus === 'not_started') {
      setCurrentStep(1)
    } else {
      setCurrentStep(3)
    }
  }, [accountStatus])

  useEffect(() => {
    if (!accountStatus) return

    setForm((prev) => ({
      business: {
        legalName: accountStatus.businessInfo?.businessName || prev.business.legalName,
        businessType:
          (accountStatus.businessInfo?.businessType as 'company' | 'individual') || prev.business.businessType,
        website: accountStatus.businessInfo?.website || prev.business.website,
      },
      representative: {
        firstName: accountStatus.personalInfo?.firstName || prev.representative.firstName,
        lastName: accountStatus.personalInfo?.lastName || prev.representative.lastName,
        email: accountStatus.personalInfo?.email || prev.representative.email,
        phone: accountStatus.personalInfo?.phone || prev.representative.phone,
      },
      bank: {
        accountHolderName: accountStatus.bankAccount?.accountHolderName || prev.bank.accountHolderName,
        bsb: prev.bank.bsb,
        accountNumber: prev.bank.accountNumber,
      },
    }))
  }, [accountStatus])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!accountStatus) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Setting up your payout account</h3>
          <p className="text-gray-600 mb-6">
            {createAccountMutation.isLoading
              ? 'Creating your payout account...'
              : 'Create your payout account to start receiving money from bookings.'}
          </p>
          {createAccountMutation.isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500 mr-2" />
              <span className="text-gray-600">Please wait...</span>
            </div>
          ) : (
            <button
              onClick={() => createAccountMutation.mutate()}
              disabled={createAccountMutation.isLoading}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create payout account
            </button>
          )}
        </div>
      </div>
    )
  }

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  const isBlocked = accountStatus.kycStatus !== 'verified' || accountStatus.status !== 'enabled'
  const hasPendingRequirements = accountStatus.verificationDetails?.currentlyDue?.length > 0
  const documentRequirements =
    accountStatus?.verificationDetails?.currentlyDue?.filter((req: string) => req.includes('document')) || []
  const isRejected = accountStatus.kycStatus === 'rejected' || accountStatus.status === 'disabled'
  const isRestricted = accountStatus.kycStatus === 'verified' && accountStatus.status === 'restricted'
  const disabledReason = accountStatus.verificationDetails?.disabledReason

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Identity &amp; Payouts</h2>
        <p className="text-gray-600">
          Complete the steps below to verify your identity and start receiving payouts.
        </p>
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-medium text-gray-900 mb-2">What you&apos;ll need</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Your business name and type</li>
            <li>Your name, email, and phone number</li>
            <li>An Australian bank account for payouts (AUD)</li>
            <li>A photo of the front and back of your ID (driver&apos;s licence, passport, or national ID)</li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            Payouts are sent weekly. We&apos;ll let you know if anything else is needed to verify your account.
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id)
            const isLast = index === steps.length - 1

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => status === 'completed' && setCurrentStep(step.id)}
                    disabled={status !== 'completed' && status !== 'current'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      status === 'completed'
                        ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                        : status === 'current'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </button>
                  <div className="mt-2 text-center">
                    <p
                      className={`text-sm font-medium ${
                        status === 'current' ? 'text-primary-600' : 'text-gray-500'
                      }`}
                    >
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                  </div>
                </div>
                {!isLast && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Business Information</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Tell us about your business. This information will be used for verification and tax purposes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.business.legalName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        business: { ...prev.business, legalName: e.target.value },
                      }))
                    }
                    placeholder="e.g., Melbourne Whisky Bar Pty Ltd"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use your registered business name as it appears on official documents
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.business.businessType}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        business: { ...prev.business, businessType: e.target.value as 'company' | 'individual' },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="company">Company / Business</option>
                    <option value="individual">Individual / Sole Trader</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose "Individual" if you operate under your own name
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
                  <input
                    value={form.business.website}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        business: { ...prev.business, website: e.target.value },
                      }))
                    }
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!form.business.legalName}
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Representative Details</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Provide details of the person who owns or manages this business. Stripe requires this for identity verification.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.representative.firstName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        representative: { ...prev.representative, firstName: e.target.value },
                      }))
                    }
                    placeholder="e.g., John"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.representative.lastName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        representative: { ...prev.representative, lastName: e.target.value },
                      }))
                    }
                    placeholder="e.g., Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.representative.email}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        representative: { ...prev.representative, email: e.target.value },
                      }))
                    }
                    placeholder="e.g., john@yourbusiness.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.representative.phone}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        representative: { ...prev.representative, phone: e.target.value },
                      }))
                    }
                    placeholder="e.g., +61 412 345 678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include country code (e.g., +61 for Australia)
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!form.representative.firstName || !form.representative.lastName || !form.representative.email || !form.representative.phone}
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Bank Account Details</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Enter your Australian bank account details where you want to receive payouts. 
                This is required to process payments to your account.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.bank.accountHolderName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        bank: { ...prev.bank, accountHolderName: e.target.value },
                      }))
                    }
                    placeholder="e.g., John Smith or Melbourne Whisky Bar Pty Ltd"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Name must exactly match your bank account
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BSB <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.bank.bsb}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        bank: { ...prev.bank, bsb: e.target.value.replace(/[^\d]/g, '').slice(0, 6) },
                      }))
                    }
                    placeholder="e.g., 062000"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    6-digit BSB code (e.g., 062000 for Commonwealth Bank)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.bank.accountNumber}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        bank: { ...prev.bank, accountNumber: e.target.value.replace(/[^\d]/g, '').slice(0, 10) },
                      }))
                    }
                    placeholder="e.g., 12345678"
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    6-10 digit account number
                  </p>
                </div>
              </div>
              
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> You can find your BSB and Account Number on your bank statement, 
                  online banking, or bank card. Payouts are processed weekly to this account.
                </p>
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  ← Back
                </button>
                <button
                  onClick={() => submitCustomOnboardingMutation.mutate()}
                  disabled={
                    submitCustomOnboardingMutation.isLoading || 
                    !form.bank.accountHolderName || 
                    form.bank.bsb.length !== 6 || 
                    form.bank.accountNumber.length < 6
                  }
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitCustomOnboardingMutation.isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit & Continue →'
                  )}
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-primary-500 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Verification Status</h3>
              </div>

              {isRejected && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <XCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-800 mb-1">Verification rejected</p>
                      <p className="text-sm text-red-700 mb-2">
                        Stripe could not verify your account. Update the details below and resubmit, or contact support if you believe this is a mistake.
                      </p>
                      {disabledReason && (
                        <p className="text-xs text-red-700 bg-red-100 rounded px-2 py-1 inline-block">
                          Reason: {disabledReason.replace(/_/g, ' ')}
                        </p>
                      )}
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="mt-3 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                      >
                        Re-enter business details
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!isRejected && isRestricted && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-orange-600 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Account restricted</p>
                      <p className="text-sm text-orange-700">
                        Your KYC is verified but Stripe has temporarily restricted payouts. Resolve any requirements below and the restriction will lift automatically.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {hasPendingRequirements && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 mb-1">Action Required</p>
                      <p className="text-sm text-yellow-700 mb-2">
                        The following information is required to complete verification:
                      </p>
                      <ul className="list-disc list-inside text-sm text-yellow-700">
                        {accountStatus.verificationDetails?.currentlyDue?.map((req: string, idx: number) => (
                          <li key={idx}>{req.replace(/_/g, ' ')}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Always-visible ID upload — owners don't need a Stripe prompt to start this */}
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-900 mb-1">Upload your ID</p>
                <p className="text-xs text-gray-600 mb-3">
                  Driver&apos;s licence, passport, or national ID. JPG/PNG/PDF, max 10MB per side.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(['front', 'back'] as const).map((side) => {
                    const identity = (accountStatus.verificationDetails as any)?.identityDocument || {}
                    const uploaded = identity[side]
                    const selectedKey = `identity_${side}`
                    return (
                      <div key={side} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-700">
                            ID {side === 'front' ? 'front' : 'back'}
                          </p>
                          {uploaded?.fileId && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              Uploaded
                            </span>
                          )}
                        </div>
                        {uploaded?.filename && (
                          <p className="text-xs text-gray-500 mb-2 truncate">
                            Current: {uploaded.filename}
                          </p>
                        )}
                        <div className="flex flex-col gap-2">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) =>
                              setSelectedFiles((prev) => ({
                                ...prev,
                                [selectedKey]: e.target.files?.[0] || null,
                              }))
                            }
                            className="text-sm"
                          />
                          <button
                            onClick={() => {
                              const file = selectedFiles[selectedKey]
                              if (!file) {
                                toast.error('Please choose a file first')
                                return
                              }
                              uploadIdentityDocumentMutation.mutate({ side, file })
                            }}
                            disabled={uploadIdentityDocumentMutation.isLoading}
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm"
                          >
                            <Upload className="h-4 w-4" />
                            {uploaded?.fileId ? 'Replace' : 'Upload'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Your ID is sent securely to our payments provider for verification. You won&apos;t see it again after upload.
                </p>
              </div>

              {documentRequirements.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-3">Additional documents requested</p>
                  <div className="space-y-3">
                    {documentRequirements.map((req: string) => (
                      <div key={req} className="border border-gray-100 rounded-lg p-3">
                        <p className="text-sm text-gray-700 mb-2">{req.replace(/_/g, ' ')}</p>
                        <div className="flex flex-col md:flex-row gap-2 md:items-center">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) =>
                              setSelectedFiles((prev) => ({
                                ...prev,
                                [req]: e.target.files?.[0] || null,
                              }))
                            }
                            className="text-sm"
                          />
                          <button
                            onClick={() => {
                              const file = selectedFiles[req]
                              if (!file) {
                                toast.error('Please choose a file first')
                                return
                              }
                              uploadRequirementDocumentMutation.mutate({ requirement: req, file })
                            }}
                            disabled={uploadRequirementDocumentMutation.isLoading}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                          >
                            <Upload className="h-4 w-4" />
                            Upload
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">KYC Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      accountStatus.kycStatus === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : accountStatus.kycStatus === 'pending_verification'
                        ? 'bg-yellow-100 text-yellow-800'
                        : accountStatus.kycStatus === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {accountStatus.kycStatus.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Charges Enabled:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      accountStatus.chargesEnabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {accountStatus.chargesEnabled ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payouts Enabled:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      accountStatus.payoutsEnabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {accountStatus.payoutsEnabled ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {hasPendingRequirements && (
                <button
                  onClick={() => queryClient.invalidateQueries('stripe-account-status')}
                  className="mt-6 w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  Refresh Verification Status
                </button>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="border-2 border-green-300 bg-green-50 rounded-lg p-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Activated!</h3>
              <p className="text-gray-600 mb-6">
                Your Stripe account is fully verified and ready to receive payments.
              </p>
              <div className="bg-white rounded-lg p-4 text-left">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Status:</strong> {accountStatus.status.toUpperCase()}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>KYC:</strong> {accountStatus.kycStatus.replace(/_/g, ' ').toUpperCase()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Payouts:</strong> {accountStatus.payoutsEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Warning if blocked */}
      {isBlocked && currentStep < 5 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 mb-1">Payouts Disabled</p>
              <p className="text-sm text-yellow-700">
                You must complete all verification steps before you can request payouts.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
