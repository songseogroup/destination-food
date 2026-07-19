import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ReviewEntityType } from '../../reviews/entities/review.entity';

export class CreateSessionDto {
  @IsEnum(ReviewEntityType)
  entityType: ReviewEntityType;

  @IsInt()
  entityId: number;

  @IsISO8601()
  startsAt: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceOverride?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSessionDto {
  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceOverride?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
