import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ReviewEntityType } from '../entities/review.entity';

export class CreateReviewDto {
  @IsEnum(ReviewEntityType)
  entityType: ReviewEntityType;

  @IsInt()
  entityId: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @Length(5, 2000, { message: 'Review must be between 5 and 2000 characters' })
  comment: string;
}

export class OwnerReplyDto {
  @IsString()
  @Length(1, 2000)
  ownerReply: string;
}
