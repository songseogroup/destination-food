import { IsString, IsEmail, IsOptional, IsBoolean, IsObject, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string; // Required for customer signup

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  // Marketing & Deal Preferences
  @IsOptional()
  @IsObject()
  preferences?: {
    dealCategories?: string[];
    notificationPreferences?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
    dietaryRestrictions?: string[];
    preferredLocations?: string[];
    preferredPriceRange?: string;
    interests?: string[];
    receiveMarketingEmails?: boolean;
    receivePromotionalDeals?: boolean;
    preferredContactMethod?: 'email' | 'sms' | 'phone';
  };
}
