import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { AnalyticsEntityType, AnalyticsEventType } from '../entities/analytics-event.entity';

export class TrackEventDto {
  @IsOptional()
  @IsEnum(AnalyticsEventType)
  eventType?: AnalyticsEventType;

  @IsEnum(AnalyticsEntityType)
  entityType: AnalyticsEntityType;

  @IsOptional()
  @IsInt()
  @Min(1)
  entityId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  referrer?: string;
}
