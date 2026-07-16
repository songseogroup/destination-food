import { IsString, IsUrl, IsOptional, IsEnum, MaxLength } from 'class-validator';

/**
 * Social platforms a venue can link. `OTHER` covers anything that isn't a
 * social network — a charity page, a GoFundMe, a Bandcamp — and pairs with the
 * free-text `label` so the UI can name the link.
 */
export enum SocialPlatform {
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  YOUTUBE = 'youtube',
  TWITTER = 'twitter',
  TIKTOK = 'tiktok',
  LINKEDIN = 'linkedin',
  OTHER = 'other',
}

/**
 * One social/external link on a Bar, Distillery or Event.
 *
 * Stored as a json array rather than one column per network so a venue can add
 * several links (including multiple `other` links), and so adding a platform
 * later is a frontend change rather than a schema migration — which matters
 * here because the backend has no migration tooling at all.
 */
export class SocialLinkDto {
  @IsEnum(SocialPlatform, {
    message: `platform must be one of: ${Object.values(SocialPlatform).join(', ')}`,
  })
  platform: SocialPlatform;

  @IsUrl({ require_protocol: true }, { message: 'url must be a full URL including https://' })
  @MaxLength(500)
  url: string;

  /** Display name, required in practice for `other` (e.g. "Our GoFundMe"). */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;
}

/** The persisted shape. Kept structural so entities don't import class-validator. */
export interface SocialLink {
  platform: `${SocialPlatform}`;
  url: string;
  label?: string;
}
