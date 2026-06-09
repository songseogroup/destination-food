import { Controller, Post, Body, Get, UseGuards, Request, UseInterceptors, UploadedFiles, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto, CreateUserDto, RegisterDto, InviteAdminUserDto, SetPasswordFromInviteDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
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
  @ApiOperation({ summary: 'Set password from invite link' })
  @ApiResponse({ status: 200, description: 'Password set successfully' })
  async setPasswordFromInvite(@Body() payload: SetPasswordFromInviteDto) {
    return this.authService.setPasswordFromInvite(payload);
  }

  @Post('register-business')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'logo', maxCount: 1 },
    { name: 'venueImage0', maxCount: 1 },
    { name: 'venueImage1', maxCount: 1 },
    { name: 'venueImage2', maxCount: 1 },
  ]))
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
}
