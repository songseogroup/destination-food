import {
  IsString,
  IsObject,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Section keys are stable identifiers the storefront maps to components, so
 * restrict them to a safe slug shape. `ad:top_hero` style keys are allowed so
 * multiple ad slots can sit at different positions.
 */
const SECTION_KEY = /^[a-z0-9_]+(:[a-z0-9_]+)?$/;

export class UpdateHomepageContentDto {
  @IsString()
  @Matches(SECTION_KEY, {
    message: 'section must be lowercase letters, numbers and underscores (optionally "prefix:key")',
  })
  section: string;

  @IsObject()
  content: Record<string, any>;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

export class ReorderItemDto {
  @IsString()
  @Matches(SECTION_KEY)
  section: string;

  @IsInt()
  @Min(0)
  order: number;

  /** Optional so the builder can persist a drag and a visibility toggle together. */
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

/** Body for POST /homepage/reorder — the whole ordering, applied atomically. */
export class ReorderHomepageDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  sections: ReorderItemDto[];
}
