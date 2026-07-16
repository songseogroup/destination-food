'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, Menu, X, LogIn, UserPlus, LogOut, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import NotificationsBell from './NotificationsBell'
import Logo from './Logo'

const NAV_LINKS = [
  { href: '/bars', label: 'Whisky Bars' },
  { href: '/distilleries', label: 'Distilleries' },
  { href: '/events', label: 'Events' },
  { href: '/blog', label: 'Journal' },
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { customer, isAuthenticated, logout } = useCustomerAuth()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // The search box previously stored keystrokes in state and did nothing with
  // them — there was no form and no submit handler, so it was decorative.
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    setIsMenuOpen(false)
    router.push(`/collections?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-charcoal-800 bg-charcoal-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between gap-4">
          <Logo className="shrink-0 text-whisky-400 transition-colors hover:text-whisky-300" />

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-charcoal-200 transition-colors hover:text-whisky-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <form onSubmit={handleSearch} className="mx-4 hidden max-w-sm flex-1 lg:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
              <input
                type="search"
                placeholder="Search tastings, tours, bars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search whisky experiences"
                className="w-full rounded-full border border-charcoal-700 bg-charcoal-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-charcoal-400 focus:border-whisky-500 focus:outline-none focus:ring-2 focus:ring-whisky-500/25"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <NotificationsBell />

            {isAuthenticated && customer ? (
              <div className="relative hidden sm:block" ref={dropdownRef}>
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  aria-expanded={isUserDropdownOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-charcoal-200 transition-colors hover:bg-charcoal-800 hover:text-white"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-whisky-500 text-xs font-bold text-white">
                    {customer.firstName[0]}
                    {customer.lastName[0]}
                  </span>
                  <span className="text-sm font-medium">{customer.firstName}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-charcoal-200 bg-white py-1 shadow-lifted">
                    <div className="border-b border-charcoal-200 px-4 py-3">
                      <p className="text-sm font-semibold text-ink">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="truncate text-xs text-charcoal-500">{customer.email}</p>
                    </div>
                    <Link
                      href="/orders"
                      className="block px-4 py-2.5 text-sm text-charcoal-700 transition-colors hover:bg-charcoal-50 hover:text-ink"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      My Bookings
                    </Link>
                    <Link
                      href="/account"
                      className="block px-4 py-2.5 text-sm text-charcoal-700 transition-colors hover:bg-charcoal-50 hover:text-ink"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      My Account
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        setIsUserDropdownOpen(false)
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-status-danger transition-colors hover:bg-charcoal-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-charcoal-200 transition-colors hover:bg-charcoal-800 hover:text-white"
                >
                  <LogIn className="h-4 w-4" />
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex items-center gap-1.5 rounded-full bg-whisky-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-whisky-600"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign up
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              className="p-2 text-charcoal-300 transition-colors hover:text-whisky-400 md:hidden"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="pb-4 lg:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
            <input
              type="search"
              placeholder="Search tastings, tours, bars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search whisky experiences"
              className="w-full rounded-full border border-charcoal-700 bg-charcoal-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-charcoal-400 focus:border-whisky-500 focus:outline-none focus:ring-2 focus:ring-whisky-500/25"
            />
          </div>
        </form>

        {isMenuOpen && (
          <div className="border-t border-charcoal-800 pb-4 md:hidden">
            <nav className="flex flex-col gap-4 pt-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-charcoal-200 transition-colors hover:text-whisky-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-charcoal-800 pt-4">
                {isAuthenticated && customer ? (
                  <>
                    <p className="mb-3 text-sm text-charcoal-400">
                      Signed in as <span className="text-white">{customer.firstName}</span>
                    </p>
                    <Link
                      href="/orders"
                      className="mb-3 block text-charcoal-200 transition-colors hover:text-whisky-400"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Bookings
                    </Link>
                    <Link
                      href="/account"
                      className="mb-3 block text-charcoal-200 transition-colors hover:text-whisky-400"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center gap-2 text-status-danger transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/auth/login"
                      className="flex items-center gap-2 text-charcoal-200 transition-colors hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LogIn className="h-4 w-4" />
                      Log in
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="flex items-center gap-2 font-medium text-whisky-400 transition-colors hover:text-whisky-300"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Sign up
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
