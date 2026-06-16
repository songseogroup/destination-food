'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Check, ArrowLeft, ArrowRight, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

interface FormData {
  // Step 1: Basic Business Details
  businessName: string
  businessType: string
  city: string
  country: string
  contactName: string
  contactEmail: string
  contactPhone: string
  websiteOrInstagram: string

  // Step 2: Profile
  shortDescription: string
  logo: File | null
  venueImages: File[]

  // Step 3: First Experience
  experienceTitle: string
  experienceType: string
  experienceDescription: string
  duration: string
  maxGuests: string
  pricePerPerson: string
  currency: string
  availabilityDays: string[]
  startTime: string

  // Step 4: Payment & Terms
  termsAccepted: boolean
}

interface PlatformConfig {
  id: number
  key: string
  label: string
  value?: any
}

// Fallback static data if API fails
const fallbackBusinessTypes = [
  'Bar',
  'Distillery',
  'Restaurant',
  'Wine Bar',
  'Whiskey Bar',
  'Cocktail Bar',
  'Brewery',
  'Other'
]

const fallbackExperienceTypes = [
  'Tasting',
  'Tour',
  'Workshop',
  'Masterclass',
  'Event',
  'Experience'
]

const fallbackCurrencies = [
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'INR', label: 'INR (₹)' },
]

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function BusinessRegistrationForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [configLoading, setConfigLoading] = useState(true)
  const [submitError, setSubmitError] = useState<{ title: string; detail?: string; showLogin?: boolean } | null>(null)
  
  // Dynamic config from API
  const [businessTypes, setBusinessTypes] = useState<string[]>(fallbackBusinessTypes)
  const [experienceTypes, setExperienceTypes] = useState<string[]>(fallbackExperienceTypes)
  const [currencies, setCurrencies] = useState<{ value: string; label: string }[]>(fallbackCurrencies)
  
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    businessType: '',
    city: '',
    country: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    websiteOrInstagram: '',
    shortDescription: '',
    logo: null,
    venueImages: [],
    experienceTitle: '',
    experienceType: '',
    experienceDescription: '',
    duration: '',
    maxGuests: '',
    pricePerPerson: '',
    currency: 'AUD',
    availabilityDays: [],
    startTime: '',
    termsAccepted: false,
  })

  // Fetch platform config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [businessTypesRes, experienceTypesRes, currenciesRes] = await Promise.all([
          api.get('/platform-config/business-types'),
          api.get('/platform-config/experience-types'),
          api.get('/platform-config/currencies'),
        ])
        
        if (businessTypesRes.data?.length > 0) {
          setBusinessTypes(businessTypesRes.data.map((c: PlatformConfig) => c.label))
        }
        if (experienceTypesRes.data?.length > 0) {
          setExperienceTypes(experienceTypesRes.data.map((c: PlatformConfig) => c.label))
        }
        if (currenciesRes.data?.length > 0) {
          setCurrencies(currenciesRes.data.map((c: PlatformConfig) => ({
            value: c.key,
            label: c.label,
          })))
        }
      } catch (err) {
        console.error('Error fetching platform config:', err)
        // Keep fallback values
      } finally {
        setConfigLoading(false)
      }
    }

    fetchConfig()
  }, [])

  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [venuePreviews, setVenuePreviews] = useState<string[]>([])

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo must be less than 2MB')
        return
      }
      if (!file.type.match(/^image\/(png|jpg|jpeg)$/)) {
        toast.error('Logo must be PNG or JPG')
        return
      }
      updateFormData('logo', file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVenueImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB')
        return
      }
      const newImages = [...formData.venueImages]
      newImages[index] = file
      updateFormData('venueImages', newImages)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const newPreviews = [...venuePreviews]
        newPreviews[index] = reader.result as string
        setVenuePreviews(newPreviews)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleAvailabilityDay = (day: string) => {
    const days = formData.availabilityDays
    if (days.includes(day)) {
      updateFormData('availabilityDays', days.filter(d => d !== day))
    } else {
      updateFormData('availabilityDays', [...days, day])
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.businessName || !formData.businessType || !formData.city || 
            !formData.country || !formData.contactName || !formData.contactEmail) {
          toast.error('Please fill all required fields')
          return false
        }
        return true
      case 2:
        if (!formData.shortDescription || formData.shortDescription.length > 300) {
          toast.error('Please provide a short description (max 300 characters)')
          return false
        }
        return true
      case 3:
        if (!formData.experienceTitle || !formData.experienceType || !formData.experienceDescription ||
            !formData.duration || !formData.maxGuests || !formData.pricePerPerson || 
            !formData.currency || formData.availabilityDays.length === 0 || !formData.startTime) {
          toast.error('Please fill all required fields')
          return false
        }
        return true
      case 4:
        if (!formData.termsAccepted) {
          toast.error('Please accept the terms and conditions')
          return false
        }
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setLoading(true)
    try {
      // Create FormData for file uploads
      const submitData = new FormData()
      
      // User data
      submitData.append('firstName', formData.contactName.split(' ')[0] || formData.contactName)
      submitData.append('lastName', formData.contactName.split(' ').slice(1).join(' ') || '')
      submitData.append('email', formData.contactEmail)
      submitData.append('password', 'temp123') // Will be set by user later
      submitData.append('role', formData.businessType.toLowerCase() === 'distillery' ? 'distillery' : 
        formData.businessType.toLowerCase().includes('bar') ? 'bar' : 'event_host')

      // Business data
      submitData.append('businessName', formData.businessName)
      submitData.append('businessType', formData.businessType)
      submitData.append('city', formData.city)
      submitData.append('country', formData.country)
      submitData.append('contactPhone', formData.contactPhone)
      submitData.append('website', formData.websiteOrInstagram)
      submitData.append('description', formData.shortDescription)
      
      // Logo
      if (formData.logo) {
        submitData.append('logo', formData.logo)
      }

      // Venue images
      formData.venueImages.forEach((img, idx) => {
        if (img) submitData.append(`venueImage${idx}`, img)
      })

      // Experience data
      submitData.append('experienceTitle', formData.experienceTitle)
      submitData.append('experienceType', formData.experienceType)
      submitData.append('experienceDescription', formData.experienceDescription)
      submitData.append('duration', formData.duration)
      submitData.append('maxGuests', formData.maxGuests)
      submitData.append('pricePerPerson', formData.pricePerPerson)
      submitData.append('currency', formData.currency)
      submitData.append('availabilityDays', JSON.stringify(formData.availabilityDays))
      submitData.append('startTime', formData.startTime)

      // Call registration API
      // Don't set Content-Type header - axios will set it automatically with boundary for FormData
      setSubmitError(null)
      const response = await api.post('/auth/register-business', submitData)

      console.log('Registration response:', response.data)
      toast.success(response.data?.message || 'Registration successful!')

      // Show password if provided (for testing)
      if (response.data?.password) {
        toast.success(`Your temporary password: ${response.data.password}`, { duration: 10000 })
      }

      router.push('/login')
    } catch (error: any) {
      console.error('Registration error:', error)
      console.error('Error response:', error.response?.data)

      // Translate backend / transport errors into something a non-engineer can act on.
      const status = error.response?.status as number | undefined
      const rawMessage = error.response?.data?.message
      const messageList: string[] = Array.isArray(rawMessage)
        ? rawMessage
        : rawMessage
        ? [String(rawMessage)]
        : []
      const firstMessage = messageList[0]

      let friendly: { title: string; detail?: string; showLogin?: boolean }

      if (!error.response) {
        // No HTTP response at all — DNS, offline, CORS preflight rejected, etc.
        friendly = {
          title: "Can't reach the server right now",
          detail:
            'Check your internet connection and try again. If this keeps happening, the platform may be temporarily unavailable.',
        }
      } else if (status === 409) {
        friendly = {
          title: 'This email is already registered',
          detail:
            'An account with this email already exists. If it\'s yours, sign in instead. Otherwise use a different email.',
          showLogin: true,
        }
      } else if (status === 400 && messageList.length > 0) {
        friendly = {
          title: 'Some details need fixing',
          detail: messageList
            .map((m) =>
              m
                .replace(/^representative\./i, '')
                .replace(/^business\./i, '')
                .replace(/^bank\./i, ''),
            )
            .join(' • '),
        }
      } else if (status === 413) {
        friendly = {
          title: 'One of your uploads is too large',
          detail: 'Logo and venue images must each be smaller than 2 MB. Try a smaller file.',
        }
      } else if (status && status >= 500) {
        friendly = {
          title: 'Something went wrong on our side',
          detail: 'Please try again in a minute. If it keeps failing, contact support.',
        }
      } else {
        friendly = {
          title: 'Registration failed',
          detail: firstMessage || 'Please review your details and try again.',
        }
      }

      setSubmitError(friendly)
      toast.error(friendly.title, { duration: 6000 })
    } finally {
      setLoading(false)
    }
  }

  const progress = (currentStep / 4) * 100

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back to Login Link */}
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-gray-400 hover:text-primary-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm text-gray-400">Step {currentStep} of 4</h2>
            <h2 className="text-lg font-semibold">
              {currentStep === 1 && 'Basic business details'}
              {currentStep === 2 && 'Create your profile'}
              {currentStep === 3 && 'Add your first experience'}
              {currentStep === 4 && 'Connect payments & review'}
            </h2>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-3xl font-bold mb-8">Tell us about your business</h1>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => updateFormData('businessName', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g. Tokyo Whisky Bar"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Business Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => updateFormData('businessType', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select type</option>
                    {businessTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g. Tokyo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => updateFormData('country', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g. Japan"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => updateFormData('contactName', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => updateFormData('contactPhone', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+81..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateFormData('contactEmail', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Website or Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.websiteOrInstagram}
                    onChange={(e) => updateFormData('websiteOrInstagram', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-3xl font-bold mb-8">Create your profile</h1>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Short Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.shortDescription}
                    onChange={(e) => updateFormData('shortDescription', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[120px]"
                    placeholder="Describe your business and what makes it special (max 300 characters)"
                    maxLength={300}
                    required
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    {formData.shortDescription.length}/300 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Logo
                  </label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      {logoPreview ? (
                        <div className="relative inline-block">
                          <img src={logoPreview} alt="Logo preview" className="max-h-32 rounded-lg" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateFormData('logo', null)
                              setLogoPreview(null)
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-400">Click to upload or drag and drop</p>
                          <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 2MB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Venue / Experience Images
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[0, 1, 2].map((idx) => (
                      <div key={idx} className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-primary-500 transition-colors cursor-pointer aspect-square">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={(e) => handleVenueImageUpload(e, idx)}
                          className="hidden"
                          id={`venue-upload-${idx}`}
                        />
                        <label htmlFor={`venue-upload-${idx}`} className="cursor-pointer block h-full">
                          {venuePreviews[idx] ? (
                            <div className="relative h-full">
                              <img src={venuePreviews[idx]} alt={`Venue ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const newImages = [...formData.venueImages]
                                  const newPreviews = [...venuePreviews]
                                  newImages[idx] = null as any
                                  newPreviews[idx] = ''
                                  updateFormData('venueImages', newImages)
                                  setVenuePreviews(newPreviews)
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <span className="text-gray-400">Image {idx + 1}</span>
                            </div>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Add your first tasting or tour</h1>
                <span className="text-sm text-gray-400">Add your first experience</span>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Experience Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.experienceTitle}
                    onChange={(e) => updateFormData('experienceTitle', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g. Japanese Whisky Tasting Flight"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Experience Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.experienceType}
                    onChange={(e) => updateFormData('experienceType', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select type</option>
                    {experienceTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.experienceDescription}
                    onChange={(e) => updateFormData('experienceDescription', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[120px]"
                    placeholder="Describe what guests can expect from this experience"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Duration (minutes) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => updateFormData('duration', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g. 90"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Guests <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.maxGuests}
                      onChange={(e) => updateFormData('maxGuests', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g. 8"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Price per person <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.pricePerPerson}
                      onChange={(e) => updateFormData('pricePerPerson', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g. 8500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => updateFormData('currency', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      {currencies.map(curr => (
                        <option key={curr.value} value={curr.value}>{curr.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Availability (Days) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleAvailabilityDay(day)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          formData.availabilityDays.includes(day)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => updateFormData('startTime', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    You can manage detailed availability later in your dashboard.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Connect payouts and go live</h1>
                <span className="text-sm text-gray-400">Connect payments & review</span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">Business Summary</h3>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>{formData.businessName || 'Business Name'}</p>
                      <p>{formData.businessType || 'Type'} • {formData.city || 'City'}, {formData.country || 'Country'}</p>
                      <p>{formData.contactEmail || 'Email'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">First Experience</h3>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>{formData.experienceTitle || 'Experience Title'}</p>
                      <p>{formData.experienceType || 'Type'} • {formData.currency || 'JPY'} {formData.pricePerPerson || '0'}</p>
                      <p>{formData.duration || '0'} min • {formData.maxGuests || '0'} guests</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold mb-2">Payouts handled for you</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        We&apos;ll set up your payout account for you once your profile is approved by our team.
                      </p>
                      <p className="text-xs text-gray-500">
                        After approval, sign in to your admin portal and go to <strong className="text-gray-300">Finance</strong> to verify your business details and start receiving payouts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => updateFormData('termsAccepted', e.target.checked)}
                    className="mt-1 w-5 h-5 text-primary-500 border-gray-700 rounded focus:ring-primary-500"
                    required
                  />
                  <span className="text-sm text-gray-400">
                    I agree to the Partner Terms & Conditions and understand that my profile will be reviewed before going live.
                  </span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Persistent error banner — doesn't auto-dismiss like the toast */}
        {submitError && (
          <div className="mt-8 bg-red-900/40 border border-red-700 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-200">{submitError.title}</p>
              {submitError.detail && (
                <p className="mt-1 text-sm text-red-300/90 leading-relaxed">{submitError.detail}</p>
              )}
              {submitError.showLogin && (
                <Link
                  href="/login"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-400 hover:text-primary-300"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in instead
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="p-1 text-red-400 hover:text-red-200 flex-shrink-0"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center"
            >
              Save & continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !formData.termsAccepted}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? 'Submitting...' : 'Finish setup'}
            </button>
          )}
        </div>

        {/* Login Link at Bottom */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary-500 hover:text-primary-400 font-semibold inline-flex items-center"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

