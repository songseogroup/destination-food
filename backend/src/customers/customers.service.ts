import { BadRequestException, Injectable, NotFoundException, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { LoginCustomerDto } from './dto/login-customer.dto';
import { CustomerForgotPasswordDto, CustomerResetPasswordDto } from './dto/forgot-password.dto';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../stripe/entities/notification.entity';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async forgotPassword(payload: CustomerForgotPasswordDto): Promise<{ message: string }> {
    const genericResponse = {
      message: 'If that email is registered, a password reset link is on its way.',
    };

    const customer = await this.findByEmail(payload.email);
    if (!customer || !customer.isActive) return genericResponse;

    const rawToken = randomBytes(32).toString('hex');
    customer.passwordResetToken = this.hashResetToken(rawToken);
    customer.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.customerRepository.save(customer);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${rawToken}`;
    const displayName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'there';

    await this.emailService
      .sendPasswordResetEmail(customer.email, displayName, resetUrl, 60)
      .catch((err) => this.logger.warn(`Reset email failed for ${customer.email}: ${err.message}`));

    return genericResponse;
  }

  async resetPassword(payload: CustomerResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.hashResetToken(payload.token);
    const customer = await this.customerRepository.findOne({ where: { passwordResetToken: tokenHash } });

    if (!customer) {
      throw new BadRequestException('Invalid or expired reset link');
    }
    if (!customer.passwordResetExpires || customer.passwordResetExpires.getTime() < Date.now()) {
      throw new BadRequestException('Reset link has expired. Please request a new one.');
    }

    customer.password = await bcrypt.hash(payload.password, 10);
    customer.passwordResetToken = null;
    customer.passwordResetExpires = null;
    await this.customerRepository.save(customer);

    return { message: 'Password updated. You can now log in with your new password.' };
  }

  async signup(createCustomerDto: CreateCustomerDto): Promise<{ customer: Customer; token: string }> {
    // Check if email already exists
    const existingCustomer = await this.findByEmail(createCustomerDto.email);
    if (existingCustomer) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createCustomerDto.password, 10);

    // Create customer with hashed password
    const customer = this.customerRepository.create({
      ...createCustomerDto,
      password: hashedPassword,
      isActive: true,
      emailVerified: false,
    });

    const savedCustomer = await this.customerRepository.save(customer);

    // Fire-and-forget welcome email — never fail signup if SMTP is down.
    const displayName = `${savedCustomer.firstName || ''} ${savedCustomer.lastName || ''}`.trim() || 'there';
    this.emailService
      .sendWelcomeEmail(savedCustomer.email, displayName, 'customer')
      .catch(() => undefined);

    // In-app welcome notification for the new customer.
    this.notificationsService
      .create({
        customerId: savedCustomer.id,
        type: NotificationType.WELCOME,
        title: 'Welcome to Destination Whisky',
        message: 'Your account is ready. Browse whisky bars, distillery tours, tastings, and events.',
      })
      .catch(() => undefined);

    // Generate JWT token
    const token = this.generateToken(savedCustomer);

    // Remove password from response
    const { password, ...customerWithoutPassword } = savedCustomer;

    return {
      customer: customerWithoutPassword as Customer,
      token,
    };
  }

  async login(loginDto: LoginCustomerDto): Promise<{ customer: Customer; token: string }> {
    const customer = await this.findByEmail(loginDto.email);

    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!customer.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, customer.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(customer);

    // Remove password from response
    const { password, ...customerWithoutPassword } = customer;

    return {
      customer: customerWithoutPassword as Customer,
      token,
    };
  }

  private generateToken(customer: Customer): string {
    const payload = {
      sub: customer.id,
      email: customer.email,
      role: 'customer',
    };
    return this.jwtService.sign(payload);
  }

  async validateCustomer(customerId: number): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { id: customerId, isActive: true },
    });
  }

  // Admin method to manually create customer (with hashed password)
  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // If password provided, hash it
    let customerData = { ...createCustomerDto };
    if (createCustomerDto.password) {
      customerData.password = await bcrypt.hash(createCustomerDto.password, 10);
    }
    
    const customer = this.customerRepository.create(customerData);
    return this.customerRepository.save(customer);
  }

  async findAll(query: any): Promise<{ data: Customer[]; total: number }> {
    const { page = 1, limit = 10, search, isActive, isVerified } = query;
    
    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true' || isVerified === true;
    }
    
    if (search) {
      where.email = Like(`%${search}%`);
    }

    const [data, total] = await this.customerRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['orders'],
    });

    return { data, total };
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['orders'],
    });
    
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    
    return customer;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { email },
      relations: ['orders'],
    });
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }

  /**
   * Customer-self-update — limited to safe profile fields. The general
   * update() above is called from admin routes and accepts the full
   * UpdateCustomerDto; this one strips anything the customer shouldn't
   * be able to touch (isActive, emailVerified, etc.).
   */
  async updateMe(
    customerId: number,
    patch: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    },
  ): Promise<Customer> {
    const customer = await this.findOne(customerId);

    if (patch.email && patch.email !== customer.email) {
      const existing = await this.findByEmail(patch.email);
      if (existing && existing.id !== customerId) {
        throw new ConflictException('That email is already in use.');
      }
      customer.email = patch.email;
      // Email changed — make them re-verify next time we wire verification.
      customer.emailVerified = false;
    }
    if (patch.firstName !== undefined) customer.firstName = patch.firstName;
    if (patch.lastName !== undefined) customer.lastName = patch.lastName;
    if (patch.phone !== undefined) customer.phone = patch.phone;

    const saved = await this.customerRepository.save(customer);
    const { password, ...safe } = saved;
    return safe as Customer;
  }

  async changeMyPassword(
    customerId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ ok: true }> {
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const matches = await bcrypt.compare(currentPassword, customer.password);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect.');
    }
    if (newPassword.length < 6) {
      throw new ConflictException('New password must be at least 6 characters.');
    }

    customer.password = await bcrypt.hash(newPassword, 10);
    await this.customerRepository.save(customer);
    return { ok: true };
  }

  async remove(id: number): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
  }

  async toggleActive(id: number): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.isActive = !customer.isActive;
    return this.customerRepository.save(customer);
  }

  async toggleVerified(id: number): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.isVerified = !customer.isVerified;
    return this.customerRepository.save(customer);
  }

  async updateOrderStats(customerId: number, orderAmount: number): Promise<void> {
    const customer = await this.findOne(customerId);
    customer.totalOrders += 1;
    customer.totalSpent = parseFloat(customer.totalSpent.toString()) + orderAmount;
    customer.lastOrderDate = new Date();
    await this.customerRepository.save(customer);
  }

  async getCustomerStats(): Promise<any> {
    const totalCustomers = await this.customerRepository.count();
    const activeCustomers = await this.customerRepository.count({ where: { isActive: true } });
    const verifiedCustomers = await this.customerRepository.count({ where: { isVerified: true } });
    
    const customersWithOrders = await this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.totalOrders > 0')
      .getCount();

    return {
      totalCustomers,
      activeCustomers,
      verifiedCustomers,
      customersWithOrders,
      conversionRate: totalCustomers > 0 ? ((customersWithOrders / totalCustomers) * 100).toFixed(2) : 0,
    };
  }
}
