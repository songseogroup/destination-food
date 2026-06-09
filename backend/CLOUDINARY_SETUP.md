# Cloudinary Integration Setup

## Overview
This backend now uses Cloudinary for image storage and management instead of local file storage. This provides better performance, CDN delivery, and automatic image optimization.

## Setup Instructions

### 1. Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Go to your dashboard to get your credentials

### 2. Environment Variables
Add these variables to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Get Your Credentials
From your Cloudinary dashboard:
- **Cloud Name**: Found in the "Product Environment Credentials" section
- **API Key**: Found in the "Product Environment Credentials" section  
- **API Secret**: Found in the "Product Environment Credentials" section

### 4. Features
- **Automatic Image Optimization**: Images are automatically optimized for web delivery
- **CDN Delivery**: Images are served from Cloudinary's global CDN
- **Multiple Formats**: Automatic format selection (WebP, AVIF, etc.)
- **Quality Optimization**: Automatic quality adjustment
- **Folder Organization**: Images are stored in `byfoods-cms` folder

### 5. API Endpoints
- `POST /upload/image` - Upload image to Cloudinary
- `DELETE /upload/image/:publicId` - Delete image from Cloudinary
- `GET /upload/image/:publicId/info` - Get image information
- `GET /upload/image/:publicId/optimized` - Get optimized image URL

### 6. Response Format
Upload response now includes:
```json
{
  "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/byfoods-cms/filename.jpg",
  "filename": "original-filename.jpg",
  "publicId": "byfoods-cms/filename"
}
```

### 7. Migration from Local Storage
If you have existing images in local storage, you'll need to:
1. Upload them to Cloudinary manually
2. Update your database records with the new Cloudinary URLs
3. Remove the old local files

## Benefits
- ✅ Faster image loading with CDN
- ✅ Automatic image optimization
- ✅ No local storage management
- ✅ Better scalability
- ✅ Image transformations on-the-fly
