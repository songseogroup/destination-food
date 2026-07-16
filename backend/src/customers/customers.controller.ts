import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { LoginCustomerDto } from './dto/login-customer.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { CustomerForgotPasswordDto, CustomerResetPasswordDto } from './dto/forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // Public signup endpoint - no authentication required
  @Post('signup')
  signup(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.signup(createCustomerDto);
  }

  // Public login endpoint - no authentication required
  @Post('login')
  login(@Body() loginDto: LoginCustomerDto) {
    return this.customersService.login(loginDto);
  }

  /**
   * Google sign-in / sign-up. Public: the Google ID token in the body is the
   * credential, and it is verified server-side against Google's certs.
   */
  @Post('auth/google')
  googleAuth(@Body() dto: GoogleAuthDto) {
    return this.customersService.loginWithGoogle(dto.idToken);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: CustomerForgotPasswordDto) {
    return this.customersService.forgotPassword(dto);
  }

  // Customer self-management — JWT identifies the caller, no id in path.

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req) {
    return this.customersService.findOne(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@Body() patch: Partial<UpdateCustomerDto>, @Request() req) {
    return this.customersService.updateMe(req.user.id, patch as any);
  }

  @Post('me/change-password')
  @UseGuards(JwtAuthGuard)
  changeMyPassword(@Body() dto: ChangePasswordDto, @Request() req) {
    return this.customersService.changeMyPassword(req.user.id, dto.currentPassword, dto.newPassword);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: CustomerResetPasswordDto) {
    return this.customersService.resetPassword(dto);
  }

  // Protected admin endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAll(@Query() query: any) {
    return this.customersService.findAll(query);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getStats() {
    return this.customersService.getCustomerStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(id);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.toggleActive(id);
  }

  @Patch(':id/toggle-verified')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  toggleVerified(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.toggleVerified(id);
  }
}
