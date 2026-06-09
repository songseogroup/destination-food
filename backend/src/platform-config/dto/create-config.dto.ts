import { IsEnum, IsString, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { ConfigType } from '../entities/platform-config.entity';

export class CreateConfigDto {
  @IsEnum(ConfigType)
  type: ConfigType;

  @IsString()
  key: string;

  @IsOptional()
  @IsObject()
  value?: any;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
