import { IsString, IsBoolean, IsArray, IsOptional, IsUrl, IsObject, IsInt, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SocialLinkDto } from '../../common/dto/social-link.dto';

export class CreateBarDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  location: string;

  @IsString()
  image: string;

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @IsString()
  priceRange: string;

  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  products?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaGallery?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  // class-validator's @IsOptional() only skips null/undefined — an empty string
  // still runs @IsUrl/@IsEmail and 400s the whole request (forbidNonWhitelisted
  // + no partial save). Admin forms submit '' for untouched optional inputs, so
  // normalise blank to undefined before validation runs.
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsObject()
  operatingHours?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  refundWindowHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bookingDepositPerGuest?: number;

  /**
   * Instagram / Facebook / YouTube / X plus `other` links such as a charity or
   * GoFundMe page. `website` above stays the venue's primary site.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];

  /** Grouped on by the destination landing pages. */
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;
}
