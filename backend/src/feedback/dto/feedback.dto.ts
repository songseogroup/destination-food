import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { FeedbackCategory, FeedbackStatus } from '../entities/feedback.entity';

export class CreateFeedbackDto {
  @IsString()
  @Length(1, 120)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(FeedbackCategory)
  category?: FeedbackCategory;

  @IsString()
  @Length(3, 200)
  subject: string;

  @IsString()
  @Length(10, 5000)
  message: string;
}

export class UpdateFeedbackDto {
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  adminNotes?: string;
}
