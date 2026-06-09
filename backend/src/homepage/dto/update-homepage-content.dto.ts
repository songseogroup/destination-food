import { IsString, IsObject } from 'class-validator';

export class UpdateHomepageContentDto {
  @IsString()
  section: string;

  @IsObject()
  content: Record<string, any>;
}
