# ByFoods Clone - Food Delivery Platform

A modern, responsive food delivery website built with Next.js, React, and Tailwind CSS. This project is a beautiful clone of a food delivery platform with excellent UI/UX design.

## 🚀 Features

### ✨ Modern Design
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Beautiful UI**: Modern design with smooth animations and hover effects
- **Gradient Backgrounds**: Eye-catching gradient designs throughout the site
- **Card-based Layout**: Clean and organized restaurant and food item displays

### 🍕 Core Functionality
- **Restaurant Browsing**: Browse through various restaurants with detailed information
- **Food Categories**: Explore different cuisines and food categories
- **Search & Filter**: Search restaurants and filter by cuisine type
- **Rating System**: Restaurant ratings and review counts
- **Delivery Information**: Real-time delivery time and fee information
- **Responsive Navigation**: Mobile-friendly navigation with hamburger menu

### 🎨 Visual Elements
- **Hero Section**: Engaging hero section with call-to-action buttons
- **Food Cards**: Beautiful restaurant cards with images and information
- **Category Icons**: Colorful category icons with hover animations
- **How It Works**: Step-by-step process explanation
- **Footer**: Comprehensive footer with links and contact information

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 14 with App Router
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Fonts**: Inter & Poppins (Google Fonts)
- **Images**: Unsplash (for demo purposes)

## 📁 Project Structure

```
byfoods-clone/
├── app/
│   ├── globals.css          # Global styles and Tailwind imports
│   ├── layout.tsx           # Root layout component
│   ├── page.tsx             # Homepage
│   └── restaurants/
│       └── page.tsx         # Restaurants listing page
├── components/
│   ├── Header.tsx           # Navigation header
│   ├── Hero.tsx             # Hero section
│   ├── Categories.tsx       # Food categories
│   ├── FeaturedRestaurants.tsx # Featured restaurants
│   ├── HowItWorks.tsx       # How it works section
│   └── Footer.tsx           # Footer component
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies and scripts
└── README.md               # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd byfoods-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

## 📱 Pages

### Homepage (`/`)
- Hero section with call-to-action
- Food categories with icons
- Featured restaurants
- How it works process
- Footer with links

### Restaurants (`/restaurants`)
- All restaurants listing
- Search functionality
- Filter by cuisine
- Sort options
- Restaurant cards with details

## 🎨 Design Features

### Color Scheme
- **Primary**: Orange gradient (#ed7519 to #de5a0f)
- **Secondary**: Blue tones (#0ea5e9 to #0284c7)
- **Accent**: Purple gradient (#d946ef to #c026d3)
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Headings**: Poppins font family
- **Body**: Inter font family
- **Responsive**: Scales appropriately across devices

### Animations
- **Hover Effects**: Cards lift and scale on hover
- **Transitions**: Smooth color and transform transitions
- **Loading States**: Gentle bounce animations
- **Micro-interactions**: Button and link hover states

## 🔧 Customization

### Colors
Edit the color scheme in `tailwind.config.js`:
```javascript
colors: {
  primary: {
    500: '#ed7519',
    // ... other shades
  }
}
```

### Content
- Update restaurant data in component files
- Modify categories in `Categories.tsx`
- Change hero content in `Hero.tsx`

### Styling
- Custom CSS classes in `globals.css`
- Component-specific styles in individual files
- Tailwind utility classes for rapid styling

## 📱 Responsive Design

The website is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms
- **Netlify**: Build command: `npm run build`
- **AWS Amplify**: Compatible with Next.js
- **Traditional hosting**: Export static files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Unsplash**: For beautiful food images
- **Tailwind CSS**: For the utility-first CSS framework
- **Next.js**: For the React framework
- **Lucide**: For the icon library

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact the development team.

---

**ByFoods Clone** - Bringing delicious food to your doorstep! 🍕🚚 