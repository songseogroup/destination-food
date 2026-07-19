import { Controller, Post, Body, Get, Patch, UseGuards, Request, UseInterceptors, UploadedFiles, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { imageUploadOptions } from '../common/upload.options';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto, CreateUserDto, RegisterDto, InviteAdminUserDto, SetPasswordFromInviteDto, ForgotPasswordDto, ResetPasswordDto, UpdateMeDto, ChangePasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register new user (Bar, Distillery, Tour Operator, Event Host)' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('admin/register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register new admin user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async adminRegister(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @Post('admin/invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite admin user via email (Admin only)' })
  @ApiResponse({ status: 201, description: 'Invite sent successfully' })
  async adminInvite(@Body() inviteDto: InviteAdminUserDto) {
    return this.authService.inviteAdminUser(inviteDto);
  }

  @Post('set-password')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Set password from invite link' })
  @ApiResponse({ status: 200, description: 'Password set successfully' })
  async setPasswordFromInvite(@Body() payload: SetPasswordFromInviteDto) {
    return this.authService.setPasswordFromInvite(payload);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Request a password reset link (owners + admins)' })
  @ApiResponse({ status: 200, description: 'Reset link sent if the email is registered' })
  async forgotPassword(@Body() payload: ForgotPasswordDto) {
    return this.authService.forgotPassword(payload);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Consume a password reset token (owners + admins)' })
  @ApiResponse({ status: 200, description: 'Password updated' })
  async resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(payload);
  }

  @Post('register-business')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'logo', maxCount: 1 },
    { name: 'venueImage0', maxCount: 1 },
    { name: 'venueImage1', maxCount: 1 },
    { name: 'venueImage2', maxCount: 1 },
  ], imageUploadOptions))
  @UsePipes(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: false }))
  @ApiOperation({ summary: 'Register business with complete details (4-step form)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Business registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async registerBusiness(
    @Body() body: any,
    @UploadedFiles() files: { logo?: Express.Multer.File[], venueImage0?: Express.Multer.File[], venueImage1?: Express.Multer.File[], venueImage2?: Express.Multer.File[] }
  ) {
    console.log('Controller - Body keys:', Object.keys(body));
    console.log('Controller - Body sample:', {
      email: body.email,
      contactEmail: body.contactEmail,
      businessName: body.businessName,
      firstName: body.firstName,
    });
    console.log('Controller - Files keys:', Object.keys(files || {}));
    return this.authService.registerBusiness(body, files);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@Request() req) {
    return req.user;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current admin / owner profile (full DB row, password stripped)' })
  async getMe(@Request() req) {
    const user = await this.authService.findUserById(req.user.id);
    if (!user) return null;
    const { password, ...safe } = user;
    return safe;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the current admin / owner profile' })
  async updateMe(@Body() dto: UpdateMeDto, @Request() req) {
    return this.authService.updateMe(req.user.id, dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the signed-in user\'s password (verifies current password)' })
  async changeMyPassword(@Body() dto: ChangePasswordDto, @Request() req) {
    return this.authService.changeMyPassword(req.user.id, dto);
  }
}
