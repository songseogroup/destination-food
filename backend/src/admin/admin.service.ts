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

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

export interface AdminUserRow {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  passwordSetAt: Date | null;
  inviteAccepted: boolean;
  createdAt: Date;
}

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

  /** Admin/SuperAdmin staff management — SuperAdmin only. */
  async listAdminUsers(): Promise<AdminUserRow[]> {
    const users = await this.userRepo.find({
      where: { role: In(ADMIN_ROLES) },
      order: { createdAt: 'DESC' },
    });
    return users.map<AdminUserRow>((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      isActive: u.isActive,
      passwordSetAt: u.passwordSetAt || null,
      // If they've accepted their invite (set a password) inviteAccepted is true.
      inviteAccepted: !!u.passwordSetAt,
      createdAt: u.createdAt,
    }));
  }

  async setAdminRole(
    targetUserId: number,
    newRole: UserRole.ADMIN | UserRole.SUPER_ADMIN,
    actorUserId: number,
  ): Promise<User> {
    if (!ADMIN_ROLES.includes(newRole)) {
      throw new BadRequestException('Role must be admin or super_admin');
    }
    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('User not found');
    if (!ADMIN_ROLES.includes(user.role)) {
      throw new BadRequestException('Can only change role on admin / super_admin users');
    }
    // Guard: prevent SuperAdmin from demoting themselves (they could lock
    // themselves out of admin features). They have to promote a peer first.
    if (user.id === actorUserId && user.role === UserRole.SUPER_ADMIN && newRole !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException(
        'You can\'t demote yourself. Promote another admin to SuperAdmin first, then ask them to demote you.',
      );
    }
    // Guard: prevent demoting the last remaining SuperAdmin.
    if (user.role === UserRole.SUPER_ADMIN && newRole !== UserRole.SUPER_ADMIN) {
      const remaining = await this.userRepo.count({ where: { role: UserRole.SUPER_ADMIN } });
      if (remaining <= 1) {
        throw new BadRequestException(
          'Cannot demote the last remaining SuperAdmin. Promote another admin first.',
        );
      }
    }
    user.role = newRole;
    return this.userRepo.save(user);
  }

  async setAdminActive(targetUserId: number, isActive: boolean, actorUserId: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('User not found');
    if (!ADMIN_ROLES.includes(user.role)) {
      throw new BadRequestException('This endpoint is for admin / super_admin users only');
    }
    if (user.id === actorUserId && !isActive) {
      throw new BadRequestException('You can\'t suspend yourself.');
    }
    if (user.role === UserRole.SUPER_ADMIN && !isActive) {
      const remainingActive = await this.userRepo.count({
        where: { role: UserRole.SUPER_ADMIN, isActive: true },
      });
      if (remainingActive <= 1) {
        throw new BadRequestException('Cannot suspend the last active SuperAdmin.');
      }
    }
    user.isActive = isActive;
    return this.userRepo.save(user);
  }
}
