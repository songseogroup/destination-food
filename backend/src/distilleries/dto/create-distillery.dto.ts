import { IsString, IsNumber, IsBoolean, IsArray, IsOptional, IsUrl, IsObject, IsInt, Min } from 'class-validator';

export class CreateDistilleryDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsNumber()
  reviews?: number;

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

  @IsString()
  established: string;

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
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsObject()
  operatingHours?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  products?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  refundWindowHours?: number;
}
