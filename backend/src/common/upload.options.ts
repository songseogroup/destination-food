import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

/**
 * Shared multer options for every image upload.
 *
 * The fileFilter rejects non-images from the request headers before the body is
 * buffered, and the size limit aborts an oversized upload mid-stream — so a
 * 2 GB "image" can't fill the process memory on its way to the Cloudinary check.
 * That check (CloudinaryService.assertIsImage) is still the last word; this just
 * stops the obvious abuse at the door.
 */
export const imageUploadOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 12,
  },
  fileFilter: (
    _req: unknown,
    file: { mimetype: string },
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (/^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      // SVG is intentionally not allowed — it can carry script.
      cb(new BadRequestException('Only JPEG, PNG, WebP, GIF or AVIF images are allowed.'), false);
    }
  },
};
