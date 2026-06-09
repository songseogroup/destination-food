import { IsBoolean, IsEnum } from 'class-validator';
import { VendorApprovalStatus } from '../../users/entities/user.entity';

export class SetApprovalDto {
  @IsEnum(VendorApprovalStatus)
  approvalStatus: VendorApprovalStatus;
}

export class SetActiveDto {
  @IsBoolean()
  isActive: boolean;
}
