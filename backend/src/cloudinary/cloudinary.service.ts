import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

/**
 * The one gate every uploaded file passes through.
 *
 * Whatever interceptor a controller uses, the bytes end up here, so this is
 * where "it must be a real image, and not too big" is enforced — defence in
 * depth that doesn't depend on each call site remembering to add a filter.
 */
const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);
// SVG is deliberately excluded: it's an XSS vector (it can carry <script>) and
// nothing here needs it. Raw/video are excluded by resource_type: 'image'.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  private assertIsImage(file: Express.Multer.File): void {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file was uploaded.');
    }
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, WebP, GIF or AVIF images are allowed.',
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('Images must be 10 MB or smaller.');
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    this.assertIsImage(file);
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          // 'image' (not 'auto'): reject anything Cloudinary wouldn't treat as a
          // real image, so a renamed executable or a video can't slip through.
          resource_type: 'image',
          folder: 'byfoods-cms',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw error;
    }
  }

  async getImageInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      console.error('Error getting image info from Cloudinary:', error);
      throw error;
    }
  }

  generateOptimizedUrl(publicId: string, options: any = {}): string {
    const defaultOptions = {
      quality: 'auto',
      fetch_format: 'auto',
      ...options
    };

    return cloudinary.url(publicId, defaultOptions);
  }
}
