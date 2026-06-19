import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback, FeedbackStatus } from './entities/feedback.entity';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../stripe/entities/notification.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    @InjectRepository(Feedback) private repo: Repository<Feedback>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async submit(dto: CreateFeedbackDto, customerId?: number): Promise<Feedback> {
    const feedback = this.repo.create({
      ...dto,
      customerId: customerId || null,
      status: FeedbackStatus.NEW,
    });
    const saved = await this.repo.save(feedback);

    // Notify every SuperAdmin that new feedback has arrived.
    this.notifySuperAdmins(saved).catch(() => undefined);

    return saved;
  }

  async list(filter: { status?: FeedbackStatus }) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    return this.repo.find({ where, order: { createdAt: 'DESC' }, take: 200 });
  }

  async stats() {
    const [total, newCount, inProgress, resolved] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { status: FeedbackStatus.NEW } }),
      this.repo.count({ where: { status: FeedbackStatus.IN_PROGRESS } }),
      this.repo.count({ where: { status: FeedbackStatus.RESOLVED } }),
    ]);
    return { total, new: newCount, inProgress, resolved };
  }

  async update(id: number, dto: UpdateFeedbackDto): Promise<Feedback> {
    const feedback = await this.repo.findOne({ where: { id } });
    if (!feedback) throw new NotFoundException('Feedback not found');
    if (dto.status !== undefined) {
      feedback.status = dto.status;
      if (dto.status === FeedbackStatus.RESOLVED && !feedback.respondedAt) {
        feedback.respondedAt = new Date();
      }
    }
    if (dto.adminNotes !== undefined) feedback.adminNotes = dto.adminNotes;
    return this.repo.save(feedback);
  }

  async delete(id: number): Promise<void> {
    const feedback = await this.repo.findOne({ where: { id } });
    if (!feedback) throw new NotFoundException('Feedback not found');
    await this.repo.delete(id);
  }

  private async notifySuperAdmins(feedback: Feedback): Promise<void> {
    const superAdmins = await this.userRepo.find({ where: { role: UserRole.SUPER_ADMIN } });
    if (!superAdmins.length) return;
    await Promise.all(
      superAdmins.map((sa) =>
        this.notificationsService.create({
          userId: sa.id,
          type: NotificationType.GENERIC,
          title: `New feedback: ${feedback.subject}`,
          message: `${feedback.name} — ${feedback.message.slice(0, 120)}${feedback.message.length > 120 ? '…' : ''}`,
          metadata: { feedbackId: feedback.id, category: feedback.category },
        }),
      ),
    );
  }
}
