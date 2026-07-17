import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  /**
   * Staff and customer tokens are signed with the same secret and both carry
   * their own table's id in `sub`, so JwtAuthGuard alone lets a customer's token
   * through on a staff route — where `req.user.id` would then be read as a
   * userId. Both tables auto-increment from 1, so customer #5 would be handed
   * staff user #5's notifications. The role claim is the only thing separating
   * them; these two checks are what keep the audiences apart.
   */
  private assertStaff(req: any) {
    if (req.user?.role === 'customer') {
      throw new ForbiddenException('This endpoint is for staff accounts');
    }
  }

  private assertCustomer(req: any) {
    if (req.user?.role !== 'customer') {
      throw new ForbiddenException('This endpoint is for customer accounts');
    }
  }

  // Owners + admins + super_admin (JWTs from /auth/login)
  @Get('notifications/mine')
  @ApiOperation({ summary: 'List notifications for the current user (owner / admin)' })
  async listMine(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.assertStaff(req);
    const items = await this.service.listForUser(
      req.user.id,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
    const unreadCount = await this.service.unreadCountForUser(req.user.id);
    return { items, unreadCount };
  }

  @Get('notifications/mine/:id')
  @ApiOperation({ summary: 'Get one notification (current user) — powers the detail page' })
  async getMine(@Param('id', ParseIntPipe) id: number, @Request() req) {
    this.assertStaff(req);
    return this.service.findOneFor(id, { userId: req.user.id });
  }

  @Patch('notifications/mine/:id/read')
  @ApiOperation({ summary: 'Mark a notification as read (current user)' })
  async markRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
    this.assertStaff(req);
    return this.service.markRead(id, { userId: req.user.id });
  }

  @Patch('notifications/mine/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read (current user)' })
  async markAllRead(@Request() req) {
    this.assertStaff(req);
    return this.service.markAllReadForUser(req.user.id);
  }

  // Customers (JWTs from /customers/login carry the customer.id as sub)
  @Get('customers/notifications/mine')
  @ApiOperation({ summary: 'List notifications for the current customer' })
  async listMineCustomer(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.assertCustomer(req);
    const customerId = req.user.id;
    const items = await this.service.listForCustomer(
      customerId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
    const unreadCount = await this.service.unreadCountForCustomer(customerId);
    return { items, unreadCount };
  }

  @Get('customers/notifications/mine/:id')
  @ApiOperation({ summary: 'Get one notification (current customer) — powers the detail page' })
  async getMineCustomer(@Param('id', ParseIntPipe) id: number, @Request() req) {
    this.assertCustomer(req);
    return this.service.findOneFor(id, { customerId: req.user.id });
  }

  @Patch('customers/notifications/mine/:id/read')
  @ApiOperation({ summary: 'Mark a notification as read (current customer)' })
  async markReadCustomer(@Param('id', ParseIntPipe) id: number, @Request() req) {
    this.assertCustomer(req);
    return this.service.markRead(id, { customerId: req.user.id });
  }

  @Patch('customers/notifications/mine/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read (current customer)' })
  async markAllReadCustomer(@Request() req) {
    this.assertCustomer(req);
    return this.service.markAllReadForCustomer(req.user.id);
  }
}
