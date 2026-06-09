import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { LoginCustomerDto } from './dto/login-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private jwtService: JwtService,
  ) {}

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
