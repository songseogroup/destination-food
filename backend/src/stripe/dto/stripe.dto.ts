import { IsNumber, IsString, IsOptional, IsEnum, Min, Max, ValidateNested, IsObject, IsEmail, IsUrl, IsIn, Matches, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { RefundType } from '../entities/refund.entity';

export class CreatePaymentIntentDto {
  @IsNumber()
  orderId: number;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;
}

export class RequestPayoutDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ApprovePayoutDto {
  // Empty for now, can add approval notes later
}

export class RejectPayoutDto {
  @IsString()
  rejectionReason: string;
}

export class RequestRefundDto {
  @IsNumber()
  orderId: number;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(RefundType)
  type: RefundType;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ProcessRefundDto {
  // Empty for now, can add processing notes later
}

class CustomOnboardingBusinessDto {
  @IsString()
  @Length(1, 200)
  legalName: string;

  @IsIn(['company', 'individual'])
  businessType: 'company' | 'individual';

  @IsOptional()
  @IsUrl({ require_protocol: false })
  website?: string;
}

class CustomOnboardingRepresentativeDto {
  @IsString()
  @Length(1, 100)
  firstName: string;

  @IsString()
  @Length(1, 100)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\+?[\d\s\-()]{6,20}$/, {
    message: 'phone must be 6-20 digits, optionally prefixed with + and may contain spaces, dashes, or parentheses',
  })
  phone: string;
}

class CustomOnboardingBankDto {
  @IsString()
  @Length(1, 200)
  accountHolderName: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'bsb must be exactly 6 digits' })
  bsb: string;

  @IsString()
  @Matches(/^\d{6,10}$/, { message: 'accountNumber must be 6 to 10 digits' })
  accountNumber: string;
}

export class SubmitCustomOnboardingDto {
  @IsObject()
  @ValidateNested()
  @Type(() => CustomOnboardingBusinessDto)
  business: CustomOnboardingBusinessDto;

  @IsObject()
  @ValidateNested()
  @Type(() => CustomOnboardingRepresentativeDto)
  representative: CustomOnboardingRepresentativeDto;

  @IsObject()
  @ValidateNested()
  @Type(() => CustomOnboardingBankDto)
  bank: CustomOnboardingBankDto;
}

export class UploadRequirementDocumentDto {
  @IsString()
  requirement: string;
}

export class UploadIdentityDocumentDto {
  @IsIn(['front', 'back'])
  side: 'front' | 'back';
}

export class UpdatePricingConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tastingOrBarEventCommissionPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  distilleryTourCommissionPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  festivalCommissionPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bookingFeeThresholdLow?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bookingFeeThresholdMid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bookingFeeLow?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bookingFeeMid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bookingFeeHigh?: number;
}
