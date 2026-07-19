import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ReviewEntityType } from '../entities/review.entity';
import { ReviewReportReason } from '../entities/review-report.entity';

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

export class ReportReviewDto {
  @IsEnum(ReviewReportReason)
  reason: ReviewReportReason;

  /** What's wrong with it, in the reporter's words. */
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  note?: string;
}

export class GrantVerifiedVisitDto {
  @IsInt()
  customerId: number;

  @IsEnum(ReviewEntityType)
  entityType: ReviewEntityType;

  @IsInt()
  entityId: number;

  /** Why the admin is vouching — kept for the audit trail. */
  @IsOptional()
  @IsString()
  note?: string;
}

export class OwnerReplyDto {
  @IsString()
  @Length(1, 2000)
  ownerReply: string;
}
