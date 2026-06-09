# ByFoods CMS Admin Dashboard

A modern, responsive admin dashboard for managing the ByFoods platform content. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Authentication**: Secure login with JWT tokens
- **Dashboard Overview**: Statistics and quick actions
- **Content Management**: Full CRUD operations for all content types
- **Homepage Management**: Dynamic homepage content editing
- **Media Library**: Image upload and management
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: React Query for efficient data management
- **Form Validation**: Comprehensive form validation with error handling

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Forms**: React Hook Form
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Installation

1. **Navigate to the CMS admin directory**
   ```bash
   cd cms-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.local .env.local
   ```
   
   Update the `.env.local` file:
   ```env
   API_BASE_URL=http://localhost:3001
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the admin dashboard**
   - Open [http://localhost:3002](http://localhost:3002)
   - Login with default credentials:
     - Email: `admin@byfoods.com`
     - Password: `admin123`

## Pages & Features

### Dashboard
- Overview statistics for all content types
- Recent content previews
- Quick action buttons
- Real-time data updates

### Homepage Management
- Edit banner content (title, subtitle, description, background image)
- Manage section titles and descriptions
- Update CTA buttons
- Image upload integration

### Bars Management
- Create, edit, and delete bars
- Manage bar details (name, type, location, specialties)
- Upload bar images
- Set ratings and reviews
- Toggle active/inactive status

### Distilleries Management
- Complete distillery information management
- Product and specialty management
- Establishment year tracking
- Contact information management

### Events Management
- Event creation and editing
- Date and time management
- Pricing and capacity settings
- Featured event marking
- Organizer information

### Blog Management
- Rich blog post creation
- Category and tag management
- SEO metadata (title, description)
- Featured post marking
- View tracking

### Media Library
- Image upload with drag & drop
- File management (view, download, delete)
- Usage statistics
- Search and filter capabilities

## API Integration

The admin dashboard integrates with the ByFoods CMS Backend API:

- **Authentication**: JWT-based authentication
- **CRUD Operations**: Full create, read, update, delete for all content types
- **File Upload**: Image upload with progress tracking
- **Search**: Real-time search across all content types
- **Pagination**: Efficient data loading with pagination

## Key Components

### Authentication
- Secure login with JWT tokens
- Automatic token refresh
- Protected routes
- User session management

### Forms
- Comprehensive form validation
- File upload integration
- Dynamic field management
- Error handling and user feedback

### Data Management
- React Query for efficient data fetching
- Optimistic updates
- Cache management
- Real-time synchronization

### UI/UX
- Responsive design
- Smooth animations
- Loading states
- Error handling
- Toast notifications

## Development

### Project Structure
```
cms-admin/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
│   ├── BarForm.tsx      # Bar management form
│   ├── EventForm.tsx    # Event management form
│   ├── BlogForm.tsx     # Blog management form
│   ├── Modal.tsx        # Modal component
│   └── ...
├── lib/                 # Utilities and configurations
│   ├── api.ts          # API client
│   ├── auth.ts         # Authentication utilities
│   └── types.ts        # TypeScript types
└── ...
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Security Features

- JWT token authentication
- Protected admin routes
- Input validation and sanitization
- File upload restrictions
- CORS configuration

## Responsive Design

The admin dashboard is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
