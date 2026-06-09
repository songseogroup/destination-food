'use client'

import React from 'react'

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
              Fresh Food
              <span className="block text-yellow-300">Delivered Fast</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-2xl mx-auto lg:mx-0">
              Order delicious meals from the best restaurants in your area. 
              Fast delivery, great prices, and amazing taste.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="btn-primary text-lg px-8 py-4">
                Order Now
              </button>
              <button className="btn-secondary text-lg px-8 py-4">
                Browse Restaurants
              </button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 max-w-md mx-auto lg:mx-0">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">500+</div>
                <div className="text-sm text-primary-100">Restaurants</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">30min</div>
                <div className="text-sm text-primary-100">Delivery</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">50k+</div>
                <div className="text-sm text-primary-100">Happy Customers</div>
              </div>
            </div>
          </div>

          {/* Right Content - Food Images */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="w-full h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl mb-4"></div>
                  <h3 className="font-semibold text-lg">Pizza Margherita</h3>
                  <p className="text-primary-100 text-sm">Fresh mozzarella & basil</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="w-full h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl mb-4"></div>
                  <h3 className="font-semibold text-lg">Fresh Salad</h3>
                  <p className="text-primary-100 text-sm">Organic vegetables</p>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="w-full h-32 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl mb-4"></div>
                  <h3 className="font-semibold text-lg">Burger Deluxe</h3>
                  <p className="text-primary-100 text-sm">Angus beef patty</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl mb-4"></div>
                  <h3 className="font-semibold text-lg">Sushi Roll</h3>
                  <p className="text-primary-100 text-sm">Fresh salmon & avocado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 w-20 h-20 bg-yellow-300/20 rounded-full animate-bounce-gentle"></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 bg-white/10 rounded-full animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
    </section>
  )
} 