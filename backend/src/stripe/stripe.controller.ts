import { Controller, Post, Get, Body, Param, UseGuards, Request, Patch, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto, RequestPayoutDto, RequestRefundDto, ProcessRefundDto, ApprovePayoutDto, RejectPayoutDto, SubmitCustomOnboardingDto, UploadRequirementDocumentDto, UpdatePricingConfigDto } from './dto/stripe.dto';

@ApiTags('Stripe')
@Controller('stripe')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('connect/create-account')
  @Roles(UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR, UserRole.DISTILLERY, UserRole.BAR)
  @ApiOperation({ summary: 'Create Stripe Connect account' })
  async createConnectAccount(@Request() req) {
    return await this.stripeService.createConnectAccount(req.user.id);
  }

  @Post('connect/ensure-account')
  @Roles(UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR, UserRole.DISTILLERY, UserRole.BAR)
  @ApiOperation({ summary: 'Ensure Stripe Connect account exists (creates if missing)' })
  async ensureConnectAccount(@Request() req) {
    const result = await this.stripeService.ensureOrCreateStripeAccount(req.user.id);
    return {
      account: result.account,
      created: result.created,
      message: result.created ? 'Stripe account created successfully' : 'Stripe account already exists',
    };
  }

  @Get('connect/account-status')
  @Roles(UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR, UserRole.DISTILLERY, UserRole.BAR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get Stripe account status' })
  async getAccountStatus(@Request() req) {
    const userId = req.user.role === UserRole.SUPER_ADMIN && req.query.userId 
      ? parseInt(req.query.userId) 
      : req.user.id;
    return await this.stripeService.getAccountStatus(userId);
  }

  @Get('connect/login-link')
  @Roles(UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR, UserRole.DISTILLERY, UserRole.BAR)
  @ApiOperation({ summary: 'Get Stripe account login link' })
  async getLoginLink(@Request() req) {
    return { url: await this.stripeService.getAccountLoginLink(req.user.id) };
  }

  @Post('connect/custom-onboarding')
  @Roles(UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR, UserRole.DISTILLERY, UserRole.BAR)
  @ApiOperation({ summary: 'Submit custom onboarding details from cms-admin' })
  async submitCustomOnboarding(@Body() dto: SubmitCustomOnboardingDto, @Request() req) {
    return await this.stripeService.submitCustomOnboarding(req.user.id, dto);
  }

  @Post('connect/requirements/upload')
  @Roles(UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR, UserRole.DISTILLERY, UserRole.BAR)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        const allowed = /\/(jpg|jpeg|png|gif|webp|pdf)$/.test(file.mimetype) || file.mimetype === 'application/pdf';
        if (!allowed) {
          return callback(new Error('Only image or PDF files are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Upload document for a specific Stripe requirement key' })
  async uploadRequirementDocument(
    @Body() dto: UploadRequirementDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return await this.stripeService.uploadRequirementDocument(req.user.id, dto.requirement, file);
  }

  @Post('payment-intent')
  @ApiOperation({ summary: 'Create payment intent for booking' })
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto, @Request() req) {
    return await this.stripeService.createPaymentIntent(dto.orderId, dto.amount, dto.currency);
  }

  @Post('payouts/request')
  @Roles(UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR, UserRole.DISTILLERY, UserRole.BAR)
  @ApiOperation({ summary: 'Request payout' })
  async requestPayout(@Body() dto: RequestPayoutDto, @Request() req) {
    return await this.stripeService.requestPayout(req.user.id, dto.amount, dto.reason);
  }

  @Post('payouts/:id/approve')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve payout (Super Admin only)' })
  async approvePayout(@Param('id') id: string, @Body() dto: ApprovePayoutDto, @Request() req) {
    return await this.stripeService.approvePayout(parseInt(id), req.user.id);
  }

  @Post('payouts/:id/reject')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject payout (Super Admin only)' })
  async rejectPayout(@Param('id') id: string, @Body() dto: RejectPayoutDto, @Request() req) {
    return await this.stripeService.rejectPayout(parseInt(id), req.user.id, dto.rejectionReason);
  }

  @Post('refunds/request')
  @Roles(UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR, UserRole.DISTILLERY, UserRole.BAR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Request refund' })
  async requestRefund(@Body() dto: RequestRefundDto, @Request() req) {
    return await this.stripeService.requestRefund(
      dto.orderId,
      dto.amount,
      dto.type,
      req.user.id,
      dto.reason,
    );
  }

  @Post('refunds/:id/process')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Process refund (Super Admin only)' })
  async processRefund(@Param('id') id: string, @Body() dto: ProcessRefundDto, @Request() req) {
    return await this.stripeService.processRefund(parseInt(id), req.user.id);
  }

  @Get('transactions')
  @Roles(UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR, UserRole.DISTILLERY, UserRole.BAR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get transaction ledger' })
  async getTransactions(@Request() req) {
    const userId = req.user.role === UserRole.SUPER_ADMIN && req.query.userId 
      ? parseInt(req.query.userId) 
      : req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    return await this.stripeService.getTransactions(userId, limit, offset);
  }

  @Get('payouts')
  @Roles(UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR, UserRole.DISTILLERY, UserRole.BAR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get payouts' })
  async getPayouts(@Request() req) {
    const userId = req.user.role === UserRole.SUPER_ADMIN && req.query.userId 
      ? parseInt(req.query.userId) 
      : req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    return await this.stripeService.getPayouts(userId, limit, offset);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notifications' })
  async getNotifications(@Request() req) {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    return await this.stripeService.getNotifications(req.user.id, limit, offset);
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markNotificationAsRead(@Param('id') id: string, @Request() req) {
    return await this.stripeService.markNotificationAsRead(parseInt(id), req.user.id);
  }

  @Get('financial-summary')
  @Roles(UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR, UserRole.DISTILLERY, UserRole.BAR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get financial summary' })
  async getFinancialSummary(@Request() req) {
    const userId = req.user.role === UserRole.SUPER_ADMIN && req.query.userId 
      ? parseInt(req.query.userId) 
      : req.user.id;
    return await this.stripeService.getFinancialSummary(userId);
  }

  @Post('kyc/remind')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send KYC incomplete reminder email (Super Admin only)' })
  async sendKYCReminder(@Body() body: { userId: number }, @Request() req) {
    await this.stripeService.sendKYCIncompleteReminder(body.userId);
    return { message: 'KYC reminder sent successfully' };
  }

  @Get('admin/pricing-config')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get platform pricing and fee configuration' })
  async getPricingConfig() {
    return await this.stripeService.getPricingConfig();
  }

  @Patch('admin/pricing-config')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update platform pricing and fee configuration' })
  async updatePricingConfig(@Body() dto: UpdatePricingConfigDto) {
    return await this.stripeService.updatePricingConfig(dto as any);
  }
}
