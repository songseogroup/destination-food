import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';

import { User, UserRole, VendorApprovalStatus } from '../users/entities/user.entity';
import { LoginDto, CreateUserDto, RegisterDto, InviteAdminUserDto, SetPasswordFromInviteDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../stripe/entities/notification.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { UploadService } from '../upload/upload.service';
import { EmailService } from '../email/email.service';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Bar)
    private barRepository: Repository<Bar>,
    @InjectRepository(Distillery)
    private distilleryRepository: Repository<Distillery>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private jwtService: JwtService,
    private uploadService: UploadService,
    private emailService: EmailService,
    private configService: ConfigService,
    private stripeService: StripeService,
    private notificationsService: NotificationsService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({ where: { email: createUserDto.email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const plainPassword = createUserDto.password || this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.ADMIN,
      approvalStatus:
        createUserDto.role &&
        [UserRole.BAR, UserRole.DISTILLERY, UserRole.EVENT_HOST].includes(createUserDto.role)
          ? VendorApprovalStatus.PENDING
          : VendorApprovalStatus.APPROVED,
    });

    const savedUser = await this.userRepository.save(user);
    await this.ensurePaymentAccountProvisioned(savedUser.id, savedUser.role);
    return savedUser;
  }

  async inviteAdminUser(inviteDto: InviteAdminUserDto) {
    const existingUser = await this.userRepository.findOne({ where: { email: inviteDto.email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashInviteToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    const user = this.userRepository.create({
      email: inviteDto.email,
      firstName: inviteDto.firstName,
      lastName: inviteDto.lastName,
      role: inviteDto.role || UserRole.ADMIN,
      password: hashedPassword,
      isActive: true,
      approvalStatus:
        [UserRole.BAR, UserRole.DISTILLERY, UserRole.TOUR_OPERATOR, UserRole.EVENT_HOST].includes(
          inviteDto.role || UserRole.ADMIN,
        )
          ? VendorApprovalStatus.PENDING
          : VendorApprovalStatus.APPROVED,
      inviteTokenHash: tokenHash,
      inviteTokenExpiresAt: expiresAt,
      passwordSetAt: null,
    });

    const savedUser = await this.userRepository.save(user);
    await this.ensurePaymentAccountProvisioned(savedUser.id, savedUser.role);
    const cmsUrl = this.configService.get<string>('CMS_ADMIN_URL') || 'http://localhost:3002';
    const inviteLink = `${cmsUrl}/set-password?token=${rawToken}`;

    const emailSent = await this.emailService.sendEmail(
      savedUser.email,
      'You have been invited to ByFoods CMS',
      `
      <p>Hi ${savedUser.firstName},</p>
      <p>A CMS account has been created for you in ByFoods.</p>
      <p>Please click the link below to set your password:</p>
      <p><a href="${inviteLink}">${inviteLink}</a></p>
      <p>This link expires in 24 hours.</p>
      <p>If you did not expect this invite, please ignore this email.</p>
      `,
    );

    return {
      message: emailSent
        ? 'Admin invited successfully. Password setup email sent.'
        : 'Admin created, but email could not be sent. Check SMTP settings.',
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
      },
      emailSent,
    };
  }

  async forgotPassword(payload: ForgotPasswordDto): Promise<{ message: string }> {
    // Always return the same response — don't leak whether the email is registered.
    const genericResponse = {
      message: 'If that email is registered, a password reset link is on its way.',
    };

    const user = await this.userRepository.findOne({ where: { email: payload.email } });
    if (!user || !user.isActive) return genericResponse;

    const rawToken = randomBytes(32).toString('hex');
    user.passwordResetTokenHash = this.hashInviteToken(rawToken);
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userRepository.save(user);

    const cmsUrl = this.configService.get<string>('CMS_ADMIN_URL') || 'http://localhost:3002';
    const resetUrl = `${cmsUrl}/reset-password?token=${rawToken}`;
    const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'there';

    await this.emailService
      .sendPasswordResetEmail(user.email, displayName, resetUrl, 60)
      .catch((err) => this.logger.warn(`Reset email failed for ${user.email}: ${err.message}`));

    return genericResponse;
  }

  async resetPassword(payload: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.hashInviteToken(payload.token);
    const user = await this.userRepository.findOne({ where: { passwordResetTokenHash: tokenHash } });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset link');
    }
    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Reset link has expired. Please request a new one.');
    }

    user.password = await bcrypt.hash(payload.password, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.passwordSetAt = new Date();
    await this.userRepository.save(user);

    return { message: 'Password updated. You can now log in with your new password.' };
  }

  async setPasswordFromInvite(payload: SetPasswordFromInviteDto) {
    const tokenHash = this.hashInviteToken(payload.token);
    const user = await this.userRepository.findOne({ where: { inviteTokenHash: tokenHash } });

    if (!user) {
      throw new BadRequestException('Invalid invite link');
    }

    if (!user.inviteTokenExpiresAt || user.inviteTokenExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invite link has expired');
    }

    user.password = await bcrypt.hash(payload.password, 10);
    user.inviteTokenHash = null;
    user.inviteTokenExpiresAt = null;
    user.passwordSetAt = new Date();
    await this.userRepository.save(user);

    return { message: 'Password set successfully. You can now log in.' };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({ where: { email: registerDto.email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Only allow specific roles for registration
    const allowedRoles = [UserRole.BAR, UserRole.DISTILLERY, UserRole.TOUR_OPERATOR, UserRole.EVENT_HOST];
    if (!allowedRoles.includes(registerDto.role)) {
      throw new ConflictException('Invalid role for registration');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      isActive: true, // New registrations are active by default
      approvalStatus: VendorApprovalStatus.PENDING,
    });

    const savedUser = await this.userRepository.save(user);
    await this.ensurePaymentAccountProvisioned(savedUser.id, savedUser.role);

    // Fire-and-forget welcome email for the new business owner.
    const displayName = `${savedUser.firstName || ''} ${savedUser.lastName || ''}`.trim() || 'there';
    this.emailService
      .sendWelcomeEmail(savedUser.email, displayName, 'owner')
      .catch((err) => this.logger.warn(`Welcome email failed for ${savedUser.email}: ${err.message}`));

    // In-app welcome notification for the new owner.
    this.notificationsService
      .create({
        userId: savedUser.id,
        type: NotificationType.WELCOME,
        title: 'Welcome to Destination Whisky',
        message:
          'Your business owner account is ready. Head to Finance to upload your ID and connect your bank for payouts.',
      })
      .catch(() => undefined);

    // Alert every SuperAdmin about the new vendor signup.
    await this.notifySuperAdminsOfVendor(savedUser).catch(() => undefined);

    // Return user without password
    const { password, ...result } = savedUser;
    return result;
  }

  private async notifySuperAdminsOfVendor(vendor: User): Promise<void> {
    const superAdmins = await this.userRepository.find({
      where: { role: UserRole.SUPER_ADMIN },
    });
    if (superAdmins.length === 0) return;
    const displayName = `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || vendor.email;
    await Promise.all(
      superAdmins.map((sa) =>
        this.notificationsService.create({
          userId: sa.id,
          type: NotificationType.VENDOR_REGISTERED,
          title: 'New vendor registered',
          message: `${displayName} (${vendor.role}) signed up and is waiting for approval.`,
          metadata: { vendorId: vendor.id, vendorEmail: vendor.email, vendorRole: vendor.role },
        }),
      ),
    );
  }

  async findUserById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async registerBusiness(body: any, files: any) {
    console.log('Register Business - Body:', JSON.stringify(body, null, 2));
    console.log('Register Business - Files:', Object.keys(files || {}));

    // Get email from either contactEmail or email field
    const email = body.contactEmail || body.email;
    if (!email) {
      throw new ConflictException('Email is required');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Determine user role based on business type or role field
    let userRole: UserRole;
    if (body.role) {
      // Use role from form if provided
      userRole = body.role.toUpperCase() === 'DISTILLERY' ? UserRole.DISTILLERY :
                 body.role.toUpperCase() === 'BAR' ? UserRole.BAR :
                 UserRole.EVENT_HOST;
    } else if (body.businessType?.toLowerCase().includes('distillery')) {
      userRole = UserRole.DISTILLERY;
    } else if (body.businessType?.toLowerCase().includes('bar') || body.businessType?.toLowerCase().includes('restaurant')) {
      userRole = UserRole.BAR;
    } else {
      userRole = UserRole.EVENT_HOST;
    }

    // Upload logo
    let logoUrl = '';
    if (files?.logo?.[0]) {
      try {
        const logoUpload = await this.uploadService.uploadFile(files.logo[0]);
        logoUrl = logoUpload.url;
      } catch (error) {
        console.error('Logo upload error:', error);
        // Continue without logo if upload fails
      }
    }

    // Upload venue images
    const venueImages: string[] = [];
    for (let i = 0; i < 3; i++) {
      const imageFile = files?.[`venueImage${i}`]?.[0];
      if (imageFile) {
        try {
          const imageUpload = await this.uploadService.uploadFile(imageFile);
          venueImages.push(imageUpload.url);
        } catch (error) {
          console.error(`Venue image ${i} upload error:`, error);
          // Continue without this image if upload fails
        }
      }
    }

    // Get password from body or generate temp password
    const password = body.password || Math.random().toString(36).slice(-12) + 'A1!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Get name fields
    const firstName = body.firstName || (body.contactName ? body.contactName.split(' ')[0] : 'Business');
    const lastName = body.lastName || (body.contactName ? body.contactName.split(' ').slice(1).join(' ') : 'Owner');
    
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: userRole,
      isActive: true, // Set to true for now, can be changed to false for review
      approvalStatus: VendorApprovalStatus.PENDING,
    });

    const savedUser = await this.userRepository.save(user);
    const stripeProvisioning = await this.ensurePaymentAccountProvisioned(savedUser.id, savedUser.role);
    console.log('User created:', savedUser.id, 'Stripe account:', stripeProvisioning.success ? 'OK' : 'FAILED');

    // Get description
    const description = body.description || body.shortDescription || '';

    // Create business entity based on type
    if (userRole === UserRole.BAR) {
      const bar = this.barRepository.create({
        name: body.businessName,
        type: body.businessType || 'Bar',
        location: body.city && body.country ? `${body.city}, ${body.country}` : body.city || body.country || '',
        image: logoUrl || venueImages[0] || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        priceRange: '$$',
        specialties: [],
        rating: 0,
        reviews: 0,
        description: description,
        address: body.city && body.country ? `${body.city}, ${body.country}` : body.city || body.country || '',
        phone: body.contactPhone || '',
        website: body.website || '',
        userId: savedUser.id,
        isActive: true, // Set to true for now
      });
      await this.barRepository.save(bar);
      console.log('Bar created:', bar.id);
    } else if (userRole === UserRole.DISTILLERY) {
      const distillery = this.distilleryRepository.create({
        name: body.businessName,
        type: body.businessType || 'Distillery',
        location: body.city && body.country ? `${body.city}, ${body.country}` : body.city || body.country || '',
        image: logoUrl || venueImages[0] || 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop',
        priceRange: '$$',
        specialties: [],
        description: description,
        address: body.city && body.country ? `${body.city}, ${body.country}` : body.city || body.country || '',
        phone: body.contactPhone || '',
        website: body.website || '',
        userId: savedUser.id,
        isActive: true, // Set to true for now
      });
      await this.distilleryRepository.save(distillery);
      console.log('Distillery created:', distillery.id);
    }

    // Create first experience/event
    let availabilityDays = [];
    try {
      availabilityDays = body.availabilityDays ? (typeof body.availabilityDays === 'string' ? JSON.parse(body.availabilityDays) : body.availabilityDays) : [];
    } catch (e) {
      console.error('Error parsing availabilityDays:', e);
    }

    const event = this.eventRepository.create({
      name: body.experienceTitle || 'First Experience',
      type: body.experienceType || 'Experience',
      date: new Date().toISOString().split('T')[0], // Today's date as default
      time: body.startTime || '12:00',
      location: body.businessName && body.city ? `${body.businessName}, ${body.city}` : body.businessName || body.city || '',
      image: venueImages[0] || logoUrl || 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=400&h=300&fit=crop',
      price: body.currency && body.pricePerPerson ? `${body.currency} ${body.pricePerPerson}` : body.pricePerPerson || '0',
      capacity: body.maxGuests || '10',
      description: body.experienceDescription || '',
      category: body.experienceType || 'Experience',
      fullDescription: body.experienceDescription || '',
      organizer: body.businessName || '',
      contactEmail: email,
      contactPhone: body.contactPhone || '',
      userId: savedUser.id,
      isActive: true, // Set to true for now
      isFeatured: false,
    });
    await this.eventRepository.save(event);
    console.log('Event created:', event.id);

    // Return success response
    return {
      message: 'Business registration submitted successfully!',
      user: {
        id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
      },
      password: password, // Return password for testing
      stripe: {
        accountProvisioned: stripeProvisioning.success,
        accountId: stripeProvisioning.account?.stripeAccountId || null,
        error: stripeProvisioning.error || null,
      },
    };
  }

  private generateTemporaryPassword() {
    return `${randomBytes(8).toString('hex')}A1!`;
  }

  private hashInviteToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async ensurePaymentAccountProvisioned(userId: number, role: UserRole): Promise<{ success: boolean; account?: any; error?: string }> {
    const eligibleRoles = [UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR, UserRole.DISTILLERY, UserRole.BAR];
    if (!eligibleRoles.includes(role)) {
      return { success: true }; // Not applicable for non-vendor roles
    }
    
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    try {
      const result = await this.stripeService.ensureOrCreateStripeAccount(userId);
      this.logger.log(
        `Stripe account ${result.created ? 'created' : 'already exists'} for user ${userId}: ${result.account.stripeAccountId}`
      );
      return { success: true, account: result.account };
    } catch (error) {
      this.logger.error(
        `Failed to provision Stripe account for user ${userId}: ${error.message}`,
        error.stack
      );
      return { success: false, error: error.message };
    }
  }
}
