import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { ReviewEntityType } from '../../reviews/entities/review.entity';

export class SubmitClaimDto {
  @IsEnum(ReviewEntityType)
  entityType: ReviewEntityType;

  @IsInt()
  entityId: number;

  @IsString()
  @Length(2, 120)
  claimantName: string;

  @IsEmail()
  claimantEmail: string;

  @IsOptional()
  @IsString()
  @Length(0, 40)
  claimantPhone?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  message?: string;
}

export class RejectClaimDto {
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  note?: string;
}
