import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { User, UserRole, VendorApprovalStatus } from '../users/entities/user.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { StripeAccount } from '../stripe/entities/stripe-account.entity';

const VENDOR_ROLES = [
  UserRole.BAR,
  UserRole.DISTILLERY,
  UserRole.EVENT_HOST,
  UserRole.TOUR_OPERATOR,
];

export interface VendorRow {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  approvalStatus: VendorApprovalStatus;
  isActive: boolean;
  listingCount: number;
  kycStatus: string | null;
  payoutsEnabled: boolean;
  createdAt: Date;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Bar) private barRepo: Repository<Bar>,
    @InjectRepository(Distillery) private distilleryRepo: Repository<Distillery>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(StripeAccount) private stripeRepo: Repository<StripeAccount>,
  ) {}

  async listVendors(filters: {
    role?: UserRole;
    approvalStatus?: VendorApprovalStatus;
    isActive?: boolean;
  }): Promise<VendorRow[]> {
    const where: any = { role: In(VENDOR_ROLES) };
    if (filters.role) {
      if (!VENDOR_ROLES.includes(filters.role)) {
        throw new BadRequestException(`Role ${filters.role} is not a vendor role`);
      }
      where.role = filters.role;
    }
    if (filters.approvalStatus) where.approvalStatus = filters.approvalStatus;
    if (typeof filters.isActive === 'boolean') where.isActive = filters.isActive;

    const users = await this.userRepo.find({ where, order: { createdAt: 'DESC' } });
    if (users.length === 0) return [];

    const userIds = users.map((u) => u.id);
    const [bars, distilleries, events, stripeAccounts] = await Promise.all([
      this.barRepo.find({ where: { userId: In(userIds) } }),
      this.distilleryRepo.find({ where: { userId: In(userIds) } }),
      this.eventRepo.find({ where: { userId: In(userIds) } }),
      this.stripeRepo.find({ where: { userId: In(userIds) } }),
    ]);

    const countByUser = (arr: { userId: number }[]) =>
      arr.reduce<Record<number, number>>((acc, x) => {
        acc[x.userId] = (acc[x.userId] || 0) + 1;
        return acc;
      }, {});
    const barCount = countByUser(bars);
    const distCount = countByUser(distilleries);
    const eventCount = countByUser(events);
    const stripeByUser = new Map(stripeAccounts.map((s) => [s.userId, s]));

    return users.map<VendorRow>((u) => {
      const listings = (barCount[u.id] || 0) + (distCount[u.id] || 0) + (eventCount[u.id] || 0);
      const stripe = stripeByUser.get(u.id);
      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        approvalStatus: u.approvalStatus,
        isActive: u.isActive,
        listingCount: listings,
        kycStatus: stripe?.kycStatus || null,
        payoutsEnabled: !!stripe?.payoutsEnabled,
        createdAt: u.createdAt,
      };
    });
  }

  async setApproval(userId: number, approvalStatus: VendorApprovalStatus): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Vendor not found');
    if (!VENDOR_ROLES.includes(user.role)) {
      throw new BadRequestException('Only vendor users have an approval status');
    }
    user.approvalStatus = approvalStatus;
    // If rejected, hide all their listings publicly as well; on approval, keep current isActive.
    if (approvalStatus === VendorApprovalStatus.REJECTED) {
      await Promise.all([
        this.barRepo.update({ userId }, { isActive: false }),
        this.distilleryRepo.update({ userId }, { isActive: false }),
        this.eventRepo.update({ userId }, { isActive: false }),
      ]);
    }
    return this.userRepo.save(user);
  }

  async setActive(userId: number, isActive: boolean): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Vendor not found');
    if (!VENDOR_ROLES.includes(user.role)) {
      throw new BadRequestException('Only vendor users can be suspended');
    }
    user.isActive = isActive;
    // Suspending a user hides their listings publicly; re-activating leaves listings in their current state.
    if (!isActive) {
      await Promise.all([
        this.barRepo.update({ userId }, { isActive: false }),
        this.distilleryRepo.update({ userId }, { isActive: false }),
        this.eventRepo.update({ userId }, { isActive: false }),
      ]);
    }
    return this.userRepo.save(user);
  }
}
