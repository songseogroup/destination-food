# ByFoods CMS Backend

A comprehensive Content Management System backend for the ByFoods platform built with NestJS, TypeORM, and MySQL.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Content Management**: Full CRUD operations for bars, distilleries, events, and blogs
- **Homepage Management**: Dynamic homepage content management
- **File Upload**: Image upload and management system
- **API Documentation**: Swagger/OpenAPI documentation
- **Database Seeding**: Automatic database initialization with default data

## Tech Stack

- **Framework**: NestJS
- **Database**: MySQL with TypeORM
- **Authentication**: JWT with Passport
- **File Upload**: Multer
- **Documentation**: Swagger/OpenAPI
- **Validation**: Class-validator & Class-transformer

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=root
   DB_PASSWORD=your_password
   DB_DATABASE=byfoods_cms

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=24h

   # File Upload Configuration
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=10485760

   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Database Setup**
   - Create a MySQL database named `byfoods_cms`
   - The application will automatically create tables and seed initial data

5. **Run the application**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## API Documentation

Once the server is running, visit:
- **API Documentation**: http://localhost:3001/api/docs
- **Server**: http://localhost:3001

## Default Admin Credentials

- **Email**: admin@byfoods.com
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /auth/login` - Login
- `POST /auth/register` - Register new admin
- `GET /auth/profile` - Get user profile

### Bars
- `GET /bars` - Get all bars (with pagination)
- `GET /bars/featured` - Get featured bars
- `GET /bars/search?q=query` - Search bars
- `GET /bars/:id` - Get bar by ID
- `POST /bars` - Create bar (Admin only)
- `PATCH /bars/:id` - Update bar (Admin only)
- `DELETE /bars/:id` - Delete bar (Admin only)

### Distilleries
- `GET /distilleries` - Get all distilleries (with pagination)
- `GET /distilleries/featured` - Get featured distilleries
- `GET /distilleries/search?q=query` - Search distilleries
- `GET /distilleries/:id` - Get distillery by ID
- `POST /distilleries` - Create distillery (Admin only)
- `PATCH /distilleries/:id` - Update distillery (Admin only)
- `DELETE /distilleries/:id` - Delete distillery (Admin only)

### Events
- `GET /events` - Get all events (with pagination)
- `GET /events/featured` - Get featured events
- `GET /events/upcoming` - Get upcoming events
- `GET /events/search?q=query` - Search events
- `GET /events/category/:category` - Get events by category
- `GET /events/:id` - Get event by ID
- `POST /events` - Create event (Admin only)
- `PATCH /events/:id` - Update event (Admin only)
- `DELETE /events/:id` - Delete event (Admin only)

### Blogs
- `GET /blogs` - Get all blog posts (with pagination)
- `GET /blogs/featured` - Get featured blog posts
- `GET /blogs/latest` - Get latest blog posts
- `GET /blogs/categories` - Get all blog categories
- `GET /blogs/search?q=query` - Search blog posts
- `GET /blogs/category/:category` - Get blog posts by category
- `GET /blogs/:id` - Get blog post by ID
- `POST /blogs` - Create blog post (Admin only)
- `PATCH /blogs/:id` - Update blog post (Admin only)
- `DELETE /blogs/:id` - Delete blog post (Admin only)

### Homepage
- `GET /homepage` - Get all homepage content
- `GET /homepage/:section` - Get homepage content by section
- `POST /homepage/update` - Update homepage content (Admin only)
- `POST /homepage/initialize` - Initialize default content (Admin only)

### Upload
- `POST /upload/image` - Upload image (Admin only)
- `DELETE /upload/image/:filename` - Delete image (Admin only)
- `GET /upload/image/:filename/info` - Get image info (Admin only)

### Users
- `GET /users` - Get all users (Admin only)
- `GET /users/:id` - Get user by ID (Admin only)
- `PATCH /users/:id` - Update user (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)

## Database Schema

### Users
- id, email, password, firstName, lastName, role, isActive, createdAt, updatedAt

### Bars
- id, name, type, rating, reviews, location, image, isOpen, priceRange, specialties, description, address, phone, website, operatingHours, isActive, createdAt, updatedAt

### Distilleries
- id, name, type, rating, reviews, location, image, isOpen, priceRange, specialties, established, description, address, phone, website, operatingHours, products, isActive, createdAt, updatedAt

### Events
- id, name, type, date, time, location, image, price, capacity, description, category, fullDescription, organizer, contactEmail, contactPhone, requirements, isActive, isFeatured, createdAt, updatedAt

### Blogs
- id, title, excerpt, content, author, date, readTime, category, image, featured, isActive, tags, metaTitle, metaDescription, views, createdAt, updatedAt

### Homepage Content
- id, section, content (JSON), createdAt, updatedAt

## Development

### Project Structure
```
src/
├── auth/           # Authentication module
├── bars/           # Bars management
├── blogs/          # Blog management
├── common/         # Shared DTOs and utilities
├── database/       # Database seeding
├── distilleries/   # Distilleries management
├── events/         # Events management
├── homepage/       # Homepage content management
├── upload/         # File upload management
├── users/          # User management
├── app.module.ts   # Main application module
└── main.ts         # Application entry point
```

### Scripts
- `npm run start:dev` - Start development server
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with class-validator
- CORS configuration
- File upload restrictions
- Role-based access control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
