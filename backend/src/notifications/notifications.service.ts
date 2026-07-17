import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationStatus,
  NotificationType,
} from '../stripe/entities/notification.entity';

interface CreateNotificationOptions {
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  // Provide either userId (owner / admin / super_admin) or customerId.
  userId?: number;
  customerId?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async create(opts: CreateNotificationOptions): Promise<Notification | null> {
    if (!opts.userId && !opts.customerId) {
      this.logger.warn('Notification.create called without userId or customerId — skipping');
      return null;
    }
    try {
      const notification = this.repo.create({
        type: opts.type,
        status: NotificationStatus.UNREAD,
        title: opts.title,
        message: opts.message,
        metadata: opts.metadata || null,
        userId: opts.userId || null,
        customerId: opts.customerId || null,
      });
      return await this.repo.save(notification);
    } catch (err) {
      this.logger.error(`Failed to create notification: ${err.message}`, err.stack);
      return null;
    }
  }

  async listForUser(userId: number, limit = 50, offset = 0) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async listForCustomer(customerId: number, limit = 50, offset = 0) {
    return this.repo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async unreadCountForUser(userId: number): Promise<number> {
    return this.repo.count({ where: { userId, status: NotificationStatus.UNREAD } });
  }

  async unreadCountForCustomer(customerId: number): Promise<number> {
    return this.repo.count({ where: { customerId, status: NotificationStatus.UNREAD } });
  }

  /**
   * One notification, scoped to whoever it belongs to. Someone else's row and a
   * row that doesn't exist both come back as 404 — the caller can't tell them
   * apart, so this can't be used to probe which notification ids exist.
   */
  async findOneFor(id: number, opts: { userId?: number; customerId?: number }) {
    const where: any = { id };
    if (opts.userId) where.userId = opts.userId;
    if (opts.customerId) where.customerId = opts.customerId;
    const notification = await this.repo.findOne({ where });
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  async markRead(id: number, opts: { userId?: number; customerId?: number }) {
    const where: any = { id };
    if (opts.userId) where.userId = opts.userId;
    if (opts.customerId) where.customerId = opts.customerId;
    const notification = await this.repo.findOne({ where });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();
    return this.repo.save(notification);
  }

  async markAllReadForUser(userId: number) {
    await this.repo.update(
      { userId, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ, readAt: new Date() },
    );
    return { ok: true };
  }

  async markAllReadForCustomer(customerId: number) {
    await this.repo.update(
      { customerId, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ, readAt: new Date() },
    );
    return { ok: true };
  }
}
