'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, User, Menu, X, LogIn, UserPlus, LogOut, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { customer, isAuthenticated, logout } = useCustomerAuth()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary-500">
              ByFoods
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/bars" className="text-white hover:text-primary-500 transition-colors">
              Bars
            </Link>
            <Link href="/distilleries" className="text-white hover:text-primary-500 transition-colors">
              Distilleries
            </Link>
            <Link href="/events" className="text-white hover:text-primary-500 transition-colors">
              Events
            </Link>
            <Link href="/blog" className="text-white hover:text-primary-500 transition-colors">
              Blog
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search bars, distilleries, events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Auth Buttons or User Dropdown */}
            {isAuthenticated && customer ? (
              /* Logged in - show user dropdown */
              <div className="relative hidden sm:block" ref={dropdownRef}>
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center text-black text-xs font-bold">
                    {customer.firstName[0]}{customer.lastName[0]}
                  </div>
                  <span className="text-sm font-medium">{customer.firstName}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-white text-sm font-medium">{customer.firstName} {customer.lastName}</p>
                      <p className="text-gray-400 text-xs truncate">{customer.email}</p>
                    </div>
                    <Link
                      href="/order"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={() => { logout(); setIsUserDropdownOpen(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Not logged in - show Login / Sign Up buttons */
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-black bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-primary-500 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search bars, distilleries, events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-800">
            <nav className="flex flex-col space-y-4 pt-4">
              <Link href="/bars" className="text-white hover:text-primary-500 transition-colors" onClick={() => setIsMenuOpen(false)}>
                Bars
              </Link>
              <Link href="/distilleries" className="text-white hover:text-primary-500 transition-colors" onClick={() => setIsMenuOpen(false)}>
                Distilleries
              </Link>
              <Link href="/events" className="text-white hover:text-primary-500 transition-colors" onClick={() => setIsMenuOpen(false)}>
                Events
              </Link>
              <Link href="/blog" className="text-white hover:text-primary-500 transition-colors" onClick={() => setIsMenuOpen(false)}>
                Blog
              </Link>

              {/* Mobile Auth */}
              <div className="pt-2 border-t border-gray-800">
                {isAuthenticated && customer ? (
                  <>
                    <p className="text-gray-400 text-sm mb-3">Signed in as <span className="text-white">{customer.firstName}</span></p>
                    <Link href="/order" className="block text-gray-300 hover:text-primary-500 transition-colors mb-3" onClick={() => setIsMenuOpen(false)}>
                      My Orders
                    </Link>
                    <button
                      onClick={() => { logout(); setIsMenuOpen(false) }}
                      className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/auth/login"
                      className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LogIn className="h-4 w-4" />
                      Login
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="flex items-center gap-2 text-primary-500 hover:text-primary-400 transition-colors font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
} 