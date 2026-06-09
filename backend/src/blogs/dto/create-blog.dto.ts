import { IsString, IsBoolean, IsArray, IsOptional, IsNumber } from 'class-validator';

export class CreateBlogDto {
  @IsString()
  title: string;

  @IsString()
  excerpt: string;

  @IsString()
  content: string;

  @IsString()
  author: string;

  @IsString()
  date: string;

  @IsString()
  readTime: string;

  @IsString()
  category: string;

  @IsString()
  image: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsNumber()
  views?: number;
}
