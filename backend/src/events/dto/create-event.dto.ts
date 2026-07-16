import {
  IsString,
  IsBoolean,
  IsArray,
  IsOptional,
  IsEmail,
  IsInt,
  IsNumber,
  IsUrl,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SocialLinkDto } from '../../common/dto/social-link.dto';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  date: string;

  @IsString()
  time: string;

  @IsString()
  location: string;

  @IsString()
  image: string;

  @IsString()
  price: string;

  @IsString()
  capacity: string;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  fullDescription?: string;

  @IsOptional()
  @IsString()
  organizer?: string;

  @IsOptional()
  // class-validator's @IsOptional() only skips null/undefined — an empty string
  // still runs @IsUrl/@IsEmail and 400s the whole request (forbidNonWhitelisted
  // + no partial save). Admin forms submit '' for untouched optional inputs, so
  // normalise blank to undefined before validation runs.
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  // class-validator's @IsOptional() only skips null/undefined — an empty string
  // still runs @IsUrl/@IsEmail and 400s the whole request (forbidNonWhitelisted
  // + no partial save). Admin forms submit '' for untouched optional inputs, so
  // normalise blank to undefined before validation runs.
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsUrl({ require_protocol: true })
  website?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];

  /**
   * These columns exist on the Event entity but were absent from this DTO.
   * Because main.ts enables `forbidNonWhitelisted`, sending any of them made the
   * whole request 400 — so the structured location fields and the media gallery
   * could never be written through POST/PATCH /events at all.
   */
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaGallery?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  refundWindowHours?: number;
}
