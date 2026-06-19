import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PageTransition from '../components/PageTransition'
import CookieConsent from '../components/CookieConsent'
import { CartProvider } from '../contexts/CartContext'
import { CustomerAuthProvider } from '../contexts/CustomerAuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ByFoods - Food Delivery Platform',
  description: 'Order delicious food from the best restaurants in your area',
  keywords: 'food delivery, restaurants, online ordering, food, delivery',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CustomerAuthProvider>
          <CartProvider>
            <PageTransition>
              <div className="min-h-screen">
                {children}
              </div>
            </PageTransition>
            <CookieConsent />
          </CartProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  )
} 