export interface Bar {
  id: number
  name: string
  type: string
  location: string
  image: string
  isOpen: boolean
  priceRange: string
  specialties: string[]
  products?: string[]
  mediaGallery?: string[]
  description?: string
  address?: string
  phone?: string
  website?: string
  operatingHours?: Record<string, string>
  isActive: boolean
  userId?: number
  createdAt: string
  updatedAt: string
}

export interface Distillery {
  id: number
  name: string
  type: string
  rating: number
  reviews: number
  location: string
  image: string
  isOpen: boolean
  priceRange: string
  specialties: string[]
  established: string
  description?: string
  address?: string
  phone?: string
  website?: string
  operatingHours?: Record<string, string>
  products?: string[]
  isActive: boolean
  userId?: number
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: number
  name: string
  type: string
  date: string
  time: string
  location: string
  image: string
  price: string
  capacity: string
  description: string
  category: string
  fullDescription?: string
  organizer?: string
  contactEmail?: string
  contactPhone?: string
  requirements?: string[]
  isActive: boolean
  isFeatured: boolean
  userId?: number
  createdAt: string
  updatedAt: string
}

export interface Blog {
  id: number
  title: string
  excerpt: string
  content: string
  author: string
  date: string
  readTime: string
  category: string
  image: string
  featured: boolean
  isActive: boolean
  tags?: string[]
  metaTitle?: string
  metaDescription?: string
  views: number
  createdAt: string
  updatedAt: string
}

export interface HomepageContent {
  id: number
  /** Stable key: 'banner', 'featured_bars', … or 'ad:<slot>'. */
  section: string
  content: Record<string, any>
  /** Render order on the public homepage, ascending. */
  order: number
  /** Hidden blocks keep their copy but are not rendered by the storefront. */
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export interface UploadResponse {
  url: string
  filename: string
}

export interface PaginationResponse<T> {
  data: T[]
  total: number
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface Order {
  id: number
  orderType: 'bar_reservation' | 'distillery_tour' | 'event_booking'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  customerName: string
  customerEmail: string
  customerPhone?: string
  barId?: number
  distilleryId?: number
  eventId?: number
  bookingDate?: string
  bookingTime?: string
  numberOfGuests: number
  totalAmount: number
  paymentMethod?: string
  isPaid: boolean
  specialRequests?: string
  createdAt: string
  updatedAt: string
  bar?: Bar
  distillery?: Distillery
  event?: Event
}
