'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiService } from '../lib/api'

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  isVerified: boolean
  preferences?: {
    dealCategories?: string[]
    notificationPreferences?: {
      email?: boolean
      sms?: boolean
      push?: boolean
    }
    dietaryRestrictions?: string[]
    preferredLocations?: string[]
    preferredPriceRange?: string
    interests?: string[]
    receiveMarketingEmails?: boolean
    receivePromotionalDeals?: boolean
    preferredContactMethod?: 'email' | 'sms' | 'phone'
  }
}

interface CustomerAuthContextType {
  customer: Customer | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  /** Exchanges a Google ID token for a session. Covers both sign-in and sign-up. */
  loginWithGoogle: (idToken: string) => Promise<void>
  logout: () => void
  updatePreferences: (preferences: Partial<Customer['preferences']>) => Promise<void>
}

interface SignupData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  preferences?: Customer['preferences']
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined)

const STORAGE_KEY = 'byfoods_customer'

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load customer from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const { customer: savedCustomer, token } = JSON.parse(stored)
        setCustomer(savedCustomer)
        // Set token in API service
        apiService.setAuthToken(token)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const saveAuthData = (customerData: Customer, token: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ customer: customerData, token }))
    apiService.setAuthToken(token)
    setCustomer(customerData)
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.loginCustomer(email, password)
      if (response.data?.customer && response.data?.token) {
        saveAuthData(response.data.customer, response.data.token)
      } else {
        throw new Error('Invalid login response')
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  const signup = async (data: SignupData) => {
    try {
      const response = await apiService.signupCustomer(data)
      if (response.data?.customer && response.data?.token) {
        saveAuthData(response.data.customer, response.data.token)
      } else {
        throw new Error('Invalid signup response')
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Signup failed')
    }
  }

  const loginWithGoogle = async (idToken: string) => {
    try {
      const response = await apiService.googleAuthCustomer(idToken)
      if (response.data?.customer && response.data?.token) {
        saveAuthData(response.data.customer, response.data.token)
      } else {
        throw new Error('Invalid Google sign-in response')
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Google sign-in failed')
    }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    apiService.setAuthToken('')
    setCustomer(null)
  }

  const updatePreferences = async (preferences: Partial<Customer['preferences']>) => {
    if (!customer) return
    
    try {
      const updatedPreferences = { ...customer.preferences, ...preferences }
      await apiService.updateCustomerProfile(customer.id, { preferences: updatedPreferences })
      setCustomer({ ...customer, preferences: updatedPreferences })
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update preferences')
    }
  }

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isAuthenticated: !!customer,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        logout,
        updatePreferences,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext)
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider')
  }
  return context
}
