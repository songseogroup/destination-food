import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole, VendorApprovalStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'approvalStatus', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'approvalStatus', 'createdAt', 'updatedAt'],
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    if (updateData.email && updateData.email !== user.email) {
      const existing = await this.userRepository.findOne({ where: { email: updateData.email } });
      if (existing && existing.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }
    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.userRepository.save(user);
  }

  async findPendingVendors(): Promise<User[]> {
    const vendorRoles = [UserRole.BAR, UserRole.DISTILLERY, UserRole.EVENT_HOST];
    return this.userRepository.find({
      where: vendorRoles.map((role) => ({ role, approvalStatus: VendorApprovalStatus.PENDING })),
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'approvalStatus', 'createdAt'],
      order: { createdAt: 'ASC' },
    });
  }

  async approveVendor(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    user.approvalStatus = VendorApprovalStatus.APPROVED;
    return this.userRepository.save(user);
  }

  async rejectVendor(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    user.approvalStatus = VendorApprovalStatus.REJECTED;
    return this.userRepository.save(user);
  }
}
