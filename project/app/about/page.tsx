import React from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

const stats = [
  { number: '500+', label: 'Restaurants' },
  { number: '50k+', label: 'Happy Customers' },
  { number: '30min', label: 'Average Delivery' },
  { number: '24/7', label: 'Customer Support' }
]

const values = [
  {
    icon: '🍽️',
    title: 'Quality Food',
    description: 'We partner with the best restaurants to ensure every meal meets our high quality standards.'
  },
  {
    icon: '⚡',
    title: 'Fast Delivery',
    description: 'Our efficient delivery network ensures your food arrives fresh and hot in record time.'
  },
  {
    icon: '🤝',
    title: 'Customer First',
    description: 'Your satisfaction is our priority. We go above and beyond to exceed your expectations.'
  },
  {
    icon: '🌱',
    title: 'Sustainability',
    description: 'We\'re committed to eco-friendly practices and reducing our environmental impact.'
  }
]

const team = [
  {
    name: 'Sarah Johnson',
    role: 'CEO & Founder',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop',
    bio: 'Former restaurant owner with 15+ years in the food industry.'
  },
  {
    name: 'Michael Chen',
    role: 'CTO',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop',
    bio: 'Tech enthusiast passionate about building seamless user experiences.'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Head of Operations',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop',
    bio: 'Operations expert with a background in logistics and customer service.'
  },
  {
    name: 'David Kim',
    role: 'Head of Marketing',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    bio: 'Creative marketer with a passion for connecting brands with customers.'
  }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                About ByFoods
              </h1>
              <p className="text-xl text-primary-100 max-w-3xl mx-auto">
                We're on a mission to connect food lovers with the best restaurants in their area, 
                making delicious meals accessible with just a few clicks.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 text-lg text-gray-600">
                  <p>
                    ByFoods was founded in 2020 with a simple mission: to make great food accessible to everyone. 
                    What started as a small startup in New York has grown into a trusted platform connecting 
                    thousands of customers with hundreds of restaurants.
                  </p>
                  <p>
                    Our founders, former restaurant owners themselves, understood the challenges both customers 
                    and restaurants face. They envisioned a platform that would not only make ordering food 
                    convenient but also support local businesses and create jobs in the community.
                  </p>
                  <p>
                    Today, we're proud to serve communities across the country, helping people discover new 
                    restaurants, enjoy their favorite meals, and support local businesses—all while ensuring 
                    fast, reliable delivery.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-w-4 aspect-h-3 rounded-2xl overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop"
                    alt="ByFoods team"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Values
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                These core values guide everything we do and shape the experience we provide to our customers and partners.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Team */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Meet Our Team
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The passionate people behind ByFoods who work tirelessly to bring you the best food delivery experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="aspect-w-1 aspect-h-1">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-primary-600 font-semibold mb-3">
                      {member.role}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {member.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-lg text-primary-100">
                  To revolutionize food delivery by creating seamless connections between customers and restaurants, 
                  making delicious meals accessible to everyone while supporting local businesses and creating 
                  economic opportunities in our communities.
                </p>
              </div>
              <div className="bg-gradient-to-br from-accent-500 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-lg text-accent-100">
                  To become the world's most loved food delivery platform, known for exceptional service, 
                  innovative technology, and unwavering commitment to our customers, restaurant partners, 
                  and delivery partners.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Awards & Recognition */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Awards & Recognition
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We're honored to be recognized for our commitment to excellence and innovation.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Best Food Delivery App 2023
                </h3>
                <p className="text-gray-600">
                  TechCrunch Disrupt Award
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                <div className="text-4xl mb-4">⭐</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Customer Choice Award
                </h3>
                <p className="text-gray-600">
                  App Store Recognition
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Green Business Award
                </h3>
                <p className="text-gray-600">
                  Environmental Excellence
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary-500 to-primary-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join the ByFoods Family
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Experience the difference that passion, innovation, and dedication make in food delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors">
                Start Ordering
              </button>
              <button className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-primary-600 transition-colors">
                Partner With Us
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
} 