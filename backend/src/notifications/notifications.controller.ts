import { Controller, Get, Param, ParseIntPipe, Patch, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  // Owners + admins + super_admin (JWTs from /auth/login)
  @Get('notifications/mine')
  @ApiOperation({ summary: 'List notifications for the current user (owner / admin)' })
  async listMine(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const items = await this.service.listForUser(
      req.user.id,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
    const unreadCount = await this.service.unreadCountForUser(req.user.id);
    return { items, unreadCount };
  }

  @Patch('notifications/mine/:id/read')
  @ApiOperation({ summary: 'Mark a notification as read (current user)' })
  async markRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.service.markRead(id, { userId: req.user.id });
  }

  @Patch('notifications/mine/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read (current user)' })
  async markAllRead(@Request() req) {
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
    const customerId = req.user.id;
    const items = await this.service.listForCustomer(
      customerId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
    const unreadCount = await this.service.unreadCountForCustomer(customerId);
    return { items, unreadCount };
  }

  @Patch('customers/notifications/mine/:id/read')
  @ApiOperation({ summary: 'Mark a notification as read (current customer)' })
  async markReadCustomer(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.service.markRead(id, { customerId: req.user.id });
  }

  @Patch('customers/notifications/mine/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read (current customer)' })
  async markAllReadCustomer(@Request() req) {
    return this.service.markAllReadForCustomer(req.user.id);
  }
}
