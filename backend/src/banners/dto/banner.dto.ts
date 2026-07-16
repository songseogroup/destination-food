import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
} from 'class-validator';
import { BannerSlot } from '../entities/banner.entity';

export class CreateBannerDto {
  @IsEnum(BannerSlot)
  slot: BannerSlot;

  @IsString()
  @Length(1, 200)
  title: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  subtitle?: string;

  // Optional: a promo band draws its imagery from the listing cards beside it,
  // so it has no banner image of its own.
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: false })
  linkUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  /**
   * Promo-band campaign copy. Only read by the `featured_above` slot, which
   * renders a copy block beside a row of discounted listing cards.
   */
  @IsOptional()
  @IsString()
  @Length(0, 40)
  highlight?: string;

  @IsOptional()
  @IsString()
  @Length(0, 40)
  ctaLabel?: string;

  @IsOptional()
  @IsString()
  @Length(0, 40)
  badgeLabel?: string;
}

export class UpdateBannerDto {
  @IsOptional()
  @IsEnum(BannerSlot)
  slot?: BannerSlot;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  subtitle?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: false })
  linkUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  /**
   * Promo-band campaign copy. Only read by the `featured_above` slot, which
   * renders a copy block beside a row of discounted listing cards.
   */
  @IsOptional()
  @IsString()
  @Length(0, 40)
  highlight?: string;

  @IsOptional()
  @IsString()
  @Length(0, 40)
  ctaLabel?: string;

  @IsOptional()
  @IsString()
  @Length(0, 40)
  badgeLabel?: string;
}
