import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsBoolean } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, VendorApprovalStatus } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { SetActiveDto, SetApprovalDto } from './dto/admin.dto';

class SetAdminRoleDto {
  @IsEnum(UserRole)
  role: UserRole.ADMIN | UserRole.SUPER_ADMIN;
}

class SetAdminActiveDto {
  @IsBoolean()
  isActive: boolean;
}

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

  // ─── Admin / SuperAdmin staff management ───────────────────────────────

  @Get('users')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all admin + super_admin staff (SuperAdmin only)' })
  async listAdminUsers() {
    return this.adminService.listAdminUsers();
  }

  @Patch('users/:id/role')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change an admin user\'s role (SuperAdmin only)' })
  async setAdminRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetAdminRoleDto,
    @Request() req,
  ) {
    return this.adminService.setAdminRole(id, dto.role as any, req.user.id);
  }

  @Patch('users/:id/active')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend or re-activate an admin user (SuperAdmin only)' })
  async setAdminActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetAdminActiveDto,
    @Request() req,
  ) {
    return this.adminService.setAdminActive(id, dto.isActive, req.user.id);
  }
}
