import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, VendorApprovalStatus } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { SetActiveDto, SetApprovalDto } from './dto/admin.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('vendors')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all vendors with filters (SuperAdmin only)' })
  async listVendors(
    @Query('role') role?: UserRole,
    @Query('approvalStatus') approvalStatus?: VendorApprovalStatus,
    @Query('isActive') isActive?: string,
  ) {
    return this.adminService.listVendors({
      role,
      approvalStatus,
      isActive: typeof isActive === 'string' ? isActive === 'true' : undefined,
    });
  }

  @Patch('vendors/:id/approval')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Set vendor approval status (SuperAdmin only)' })
  async setApproval(@Param('id', ParseIntPipe) id: number, @Body() dto: SetApprovalDto) {
    return this.adminService.setApproval(id, dto.approvalStatus);
  }

  @Patch('vendors/:id/active')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend or re-activate a vendor (SuperAdmin only)' })
  async setActive(@Param('id', ParseIntPipe) id: number, @Body() dto: SetActiveDto) {
    return this.adminService.setActive(id, dto.isActive);
  }
}
