import React from 'react'
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import PageTransition from '../components/PageTransition'
import CookieConsent from '../components/CookieConsent'
import { CartProvider } from '../contexts/CartContext'
import { CustomerAuthProvider } from '../contexts/CustomerAuthContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Serif display face for headings and the wordmark — carries the premium whisky
// tone that Inter-everywhere could not.
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Destination Whisky — Book Whisky Tastings, Distillery Tours & Events',
    template: '%s | Destination Whisky',
  },
  description:
    'Discover and book whisky experiences — tastings, distillery tours, whisky bar events and festivals. Find your next dram with Destination Whisky.',
  keywords:
    'whisky tastings, distillery tours, whisky events, whisky festivals, whisky bars, whisky experiences, book whisky',
  openGraph: {
    title: 'Destination Whisky — Book Whisky Tastings, Distillery Tours & Events',
    description:
      'Discover and book whisky experiences — tastings, distillery tours, whisky bar events and festivals.',
    type: 'website',
    siteName: 'Destination Whisky',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <CustomerAuthProvider>
          <CartProvider>
            <PageTransition>
              <div className="min-h-screen">{children}</div>
            </PageTransition>
            <CookieConsent />
          </CartProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  )
}
