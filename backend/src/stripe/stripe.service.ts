import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

import { User, UserRole } from '../users/entities/user.entity';
import { StripeAccount, StripeAccountStatus, KYCStatus } from './entities/stripe-account.entity';
import { TransactionLedger, TransactionType, TransactionStatus } from './entities/transaction-ledger.entity';
import { Payout, PayoutStatus } from './entities/payout.entity';
import { Refund, RefundStatus, RefundType } from './entities/refund.entity';
import { Notification, NotificationType } from './entities/notification.entity';
import { Order, OrderStatus, OrderType } from '../orders/entities/order.entity';
import { EmailService } from '../email/email.service';
import { PricingConfig } from './entities/pricing-config.entity';

type CustomOnboardingPayload = {
  business: {
    legalName: string;
    businessType: string;
    website?: string;
  };
  representative: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  bank: {
    accountHolderName: string;
    bsb: string;
    accountNumber: string;
  };
};

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);
  private readonly defaultCurrency = 'aud';

  constructor(
    private configService: ConfigService,
    @InjectRepository(StripeAccount)
    private stripeAccountRepository: Repository<StripeAccount>,
    @InjectRepository(TransactionLedger)
    private transactionLedgerRepository: Repository<TransactionLedger>,
    @InjectRepository(Payout)
    private payoutRepository: Repository<Payout>,
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(PricingConfig)
    private pricingConfigRepository: Repository<PricingConfig>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private emailService: EmailService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });
  }

  /**
   * Ensure a Stripe Connect account exists for a business owner.
   * Creates one if missing. Used during business registration.
   */
  async ensureOrCreateStripeAccount(userId: number): Promise<{ account: StripeAccount; created: boolean }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only allow Event Host, Tour Operator, Distillery, and Bar roles
    const eligibleRoles = [UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR, UserRole.DISTILLERY, UserRole.BAR];
    if (!eligibleRoles.includes(user.role)) {
      throw new BadRequestException('Stripe Connect is only available for Event Hosts, Tour Operators, Distilleries, and Bars');
    }

    // Check if account already exists
    const existingAccount = await this.stripeAccountRepository.findOne({ where: { userId } });
    if (existingAccount) {
      return { account: existingAccount, created: false };
    }

    // Create new account
    const account = await this.createConnectAccount(userId);
    return { account, created: true };
  }

  /**
   * Create a Stripe Connect Express account for Event/Tour organizers
   */
  async createConnectAccount(userId: number): Promise<StripeAccount> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only allow Event Host, Tour Operator, Distillery, and Bar roles
    if (
      user.role !== UserRole.EVENT_HOST &&
      user.role !== UserRole.TOUR_OPERATOR &&
      user.role !== UserRole.DISTILLERY &&
      user.role !== UserRole.BAR
    ) {
      throw new BadRequestException('Stripe Connect is only available for Event Hosts, Tour Operators, Distilleries, and Bars');
    }

    // Check if account already exists
    const existingAccount = await this.stripeAccountRepository.findOne({ where: { userId } });
    if (existingAccount) {
      return existingAccount;
    }

    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: 'AU',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          mcc: '7999',
          product_description: 'Whisky experiences, distillery tours, tastings, and events',
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'weekly',
              weekly_anchor: 'tuesday',
            },
          },
        },
        metadata: {
          userId: userId.toString(),
          userEmail: user.email,
        },
      });

      const stripeAccount = this.stripeAccountRepository.create({
        userId,
        stripeAccountId: account.id,
        status: StripeAccountStatus.PENDING,
        kycStatus: KYCStatus.NOT_STARTED,
      });

      return await this.stripeAccountRepository.save(stripeAccount);
    } catch (error) {
      this.logger.error(`Error creating Stripe account: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create Stripe account: ${error.message}`);
    }
  }

  /**
   * Get Stripe account status
   */
  async getAccountStatus(userId: number): Promise<StripeAccount> {
    const account = await this.stripeAccountRepository.findOne({ where: { userId } });
    if (!account) {
      throw new NotFoundException('Stripe account not found');
    }

    // Sync with Stripe
    try {
      const stripeAccount = await this.stripe.accounts.retrieve(account.stripeAccountId);
      
      account.status = stripeAccount.charges_enabled && stripeAccount.payouts_enabled
        ? StripeAccountStatus.ENABLED
        : stripeAccount.details_submitted
        ? StripeAccountStatus.RESTRICTED
        : StripeAccountStatus.PENDING;

      account.chargesEnabled = stripeAccount.charges_enabled;
      account.payoutsEnabled = stripeAccount.payouts_enabled;

      // Update KYC status
      if (stripeAccount.requirements) {
        account.verificationDetails = {
          requirements: stripeAccount.requirements,
          currentlyDue: stripeAccount.requirements.currently_due || [],
          eventuallyDue: stripeAccount.requirements.eventually_due || [],
          disabledReason: stripeAccount.requirements.disabled_reason || null,
          pastDue: stripeAccount.requirements.past_due || [],
        };

        if (stripeAccount.requirements.currently_due?.length === 0 && 
            stripeAccount.requirements.past_due?.length === 0) {
          account.kycStatus = KYCStatus.VERIFIED;
        } else if (stripeAccount.requirements.currently_due?.length > 0) {
          account.kycStatus = KYCStatus.PENDING_VERIFICATION;
        } else {
          account.kycStatus = KYCStatus.IN_PROGRESS;
        }
      }

      return await this.stripeAccountRepository.save(account);
    } catch (error) {
      this.logger.error(`Error syncing Stripe account: ${error.message}`, error.stack);
      return account;
    }
  }

  /**
   * Submit owner-provided onboarding details from custom cms-admin UI.
   * This keeps onboarding in-app while still syncing requirements from Stripe.
   */
  async submitCustomOnboarding(userId: number, payload: CustomOnboardingPayload): Promise<StripeAccount> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let account = await this.stripeAccountRepository.findOne({ where: { userId } });
    if (!account) {
      account = await this.createConnectAccount(userId);
    }

    const cleanedBsb = (payload.bank.bsb || '').replace(/\D/g, '');
    const cleanedAccountNumber = (payload.bank.accountNumber || '').replace(/\D/g, '');
    if (cleanedBsb.length !== 6) {
      throw new BadRequestException('BSB must be exactly 6 digits');
    }
    if (cleanedAccountNumber.length < 6 || cleanedAccountNumber.length > 10) {
      throw new BadRequestException('Account number must be 6 to 10 digits');
    }

    try {
      await this.stripe.accounts.update(account.stripeAccountId, {
        business_type: payload.business.businessType as 'company' | 'individual',
        business_profile: {
          name: payload.business.legalName,
          url: payload.business.website || undefined,
          product_description: 'Whisky experiences, distillery tours, tastings, and events',
          mcc: '7999',
        },
        company:
          payload.business.businessType === 'company'
            ? {
                name: payload.business.legalName,
              }
            : undefined,
        individual:
          payload.business.businessType === 'individual'
            ? {
                first_name: payload.representative.firstName,
                last_name: payload.representative.lastName,
                email: payload.representative.email,
                phone: payload.representative.phone,
              }
            : undefined,
      });

      // Snapshot existing external bank accounts BEFORE creating the new one. Stripe blocks
      // deleting the default-for-currency account until another default exists, so we create
      // the new one (which becomes default) first and clean up the previous accounts after.
      const previousExternal = await this.stripe.accounts.listExternalAccounts(account.stripeAccountId, {
        object: 'bank_account',
        limit: 100,
      });

      // For AU accounts, Stripe accepts BSB+account number when creating/updating external bank accounts.
      await this.stripe.accounts.createExternalAccount(account.stripeAccountId, {
        external_account: {
          object: 'bank_account',
          country: 'AU',
          currency: this.defaultCurrency,
          account_holder_name: payload.bank.accountHolderName,
          account_holder_type: payload.business.businessType === 'company' ? 'company' : 'individual',
          routing_number: cleanedBsb,
          account_number: cleanedAccountNumber,
        },
        default_for_currency: true,
      } as any);

      for (const ext of previousExternal.data) {
        try {
          await this.stripe.accounts.deleteExternalAccount(account.stripeAccountId, ext.id);
        } catch (delErr) {
          this.logger.warn(
            `Could not delete external bank account ${ext.id} on ${account.stripeAccountId}: ${delErr.message}`,
          );
        }
      }

      account.businessInfo = {
        businessName: payload.business.legalName,
        businessType: payload.business.businessType,
        website: payload.business.website,
      };
      account.personalInfo = {
        firstName: payload.representative.firstName,
        lastName: payload.representative.lastName,
        email: payload.representative.email,
        phone: payload.representative.phone,
      };
      account.bankAccount = {
        accountHolderName: payload.bank.accountHolderName,
        routingNumber: cleanedBsb,
        accountNumber: `****${cleanedAccountNumber.slice(-4)}`,
        country: 'AU',
        currency: this.defaultCurrency,
      };
      account.kycStatus = KYCStatus.IN_PROGRESS;

      await this.stripeAccountRepository.save(account);
      return await this.getAccountStatus(userId);
    } catch (error) {
      this.logger.error(`Error submitting custom onboarding: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to submit onboarding details: ${error.message}`);
    }
  }

  async uploadRequirementDocument(
    userId: number,
    requirement: string,
    file: Express.Multer.File,
  ): Promise<{ uploaded: boolean; requirement: string; fileId: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const account = await this.stripeAccountRepository.findOne({ where: { userId } });
    if (!account) {
      throw new NotFoundException('Stripe account not found');
    }

    const synced = await this.getAccountStatus(userId);
    const currentlyDue = synced.verificationDetails?.currentlyDue || [];
    const eventuallyDue = synced.verificationDetails?.eventuallyDue || [];
    if (![...currentlyDue, ...eventuallyDue].includes(requirement)) {
      throw new BadRequestException(`Unsupported requirement key: ${requirement}`);
    }
    if (!requirement.includes('document')) {
      throw new BadRequestException(
        'This requirement is not a document upload field. Please submit the data through custom onboarding form.',
      );
    }

    try {
      const uploadedFile = await this.stripe.files.create({
        purpose: 'account_requirement',
        file: {
          data: file.buffer,
          name: file.originalname,
          type: file.mimetype,
        } as any,
      });

      const updatePayload = this.buildNestedStripeField(requirement, uploadedFile.id);
      await this.stripe.accounts.update(account.stripeAccountId, updatePayload as any);

      const accountRecord = await this.stripeAccountRepository.findOne({ where: { userId } });
      if (accountRecord) {
        const existing = accountRecord.verificationDetails || {};
        const uploaded = (existing as any).uploadedDocuments || {};
        const previous = uploaded[requirement];
        const history = Array.isArray(previous?.history) ? [...previous.history] : [];
        if (previous?.fileId) {
          history.push({
            fileId: previous.fileId,
            uploadedAt: previous.uploadedAt,
            filename: previous.filename,
          });
        }
        accountRecord.verificationDetails = {
          ...existing,
          uploadedDocuments: {
            ...uploaded,
            [requirement]: {
              fileId: uploadedFile.id,
              uploadedAt: new Date().toISOString(),
              filename: file.originalname,
              history,
            },
          },
        };
        await this.stripeAccountRepository.save(accountRecord);
      }

      await this.getAccountStatus(userId);
      return { uploaded: true, requirement, fileId: uploadedFile.id };
    } catch (error) {
      this.logger.error(`Error uploading requirement document: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload document: ${error.message}`);
    }
  }

  /**
   * Upload one side of the owner's identity document (driver's license / passport / ID card).
   * The platform handles the Stripe-side compliance flow on their behalf — owners just
   * upload front and back, and we ship them to Stripe with the correct purpose and
   * patch individual.verification.document.{front,back} on the connected account.
   */
  async uploadIdentityDocument(
    userId: number,
    side: 'front' | 'back',
    file: Express.Multer.File,
  ): Promise<{ uploaded: boolean; side: 'front' | 'back'; fileId: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (side !== 'front' && side !== 'back') {
      throw new BadRequestException('side must be "front" or "back"');
    }

    let account = await this.stripeAccountRepository.findOne({ where: { userId } });
    if (!account) {
      const created = await this.ensureOrCreateStripeAccount(userId);
      account = created.account;
    }

    try {
      const uploadedFile = await this.stripe.files.create({
        purpose: 'identity_document',
        file: {
          data: file.buffer,
          name: file.originalname,
          type: file.mimetype,
        } as any,
      });

      await this.stripe.accounts.update(account.stripeAccountId, {
        individual: {
          verification: {
            document: {
              [side]: uploadedFile.id,
            },
          },
        },
      } as any);

      const accountRecord = await this.stripeAccountRepository.findOne({ where: { userId } });
      if (accountRecord) {
        const existing = accountRecord.verificationDetails || {};
        const identity = (existing as any).identityDocument || {};
        const previous = identity[side];
        const history = Array.isArray(previous?.history) ? [...previous.history] : [];
        if (previous?.fileId) {
          history.push({
            fileId: previous.fileId,
            uploadedAt: previous.uploadedAt,
            filename: previous.filename,
          });
        }
        accountRecord.verificationDetails = {
          ...existing,
          identityDocument: {
            ...identity,
            [side]: {
              fileId: uploadedFile.id,
              uploadedAt: new Date().toISOString(),
              filename: file.originalname,
              history,
            },
          },
        };
        await this.stripeAccountRepository.save(accountRecord);
      }

      await this.getAccountStatus(userId);
      return { uploaded: true, side, fileId: uploadedFile.id };
    } catch (error) {
      this.logger.error(`Error uploading identity document: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload identity document: ${error.message}`);
    }
  }

  /**
   * SuperAdmin view: return whatever identity-document metadata + Stripe file links exist
   * for a given vendor. The returned URLs are short-lived Stripe FileLink URLs that the
   * SuperAdmin can use to view/download the uploaded ID.
   */
  async getIdentityDocumentsForVendor(userId: number): Promise<{
    front?: { fileId: string; uploadedAt: string; filename: string; url?: string };
    back?: { fileId: string; uploadedAt: string; filename: string; url?: string };
  }> {
    const account = await this.stripeAccountRepository.findOne({ where: { userId } });
    if (!account) {
      throw new NotFoundException('No Stripe account for this vendor');
    }
    const identity = (account.verificationDetails as any)?.identityDocument || {};

    const result: Record<string, any> = {};
    for (const side of ['front', 'back'] as const) {
      const entry = identity[side];
      if (!entry?.fileId) continue;
      let url: string | undefined;
      try {
        const link = await this.stripe.fileLinks.create({
          file: entry.fileId,
          expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
        });
        url = link.url || undefined;
      } catch (err) {
        this.logger.warn(`Could not create FileLink for ${entry.fileId}: ${err.message}`);
      }
      result[side] = {
        fileId: entry.fileId,
        uploadedAt: entry.uploadedAt,
        filename: entry.filename,
        url,
      };
    }
    return result;
  }

  /**
   * Create payment intent for event/tour booking
   */
  async createPaymentIntent(orderId: number, _amount: number, currency: string = 'aud'): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const order = await this.orderRepository.findOne({ 
      where: { id: orderId },
      relations: ['event', 'event.owner', 'distillery', 'distillery.owner'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only allow payments for events and tours
    if (order.orderType !== 'event_booking' && order.orderType !== 'distillery_tour') {
      throw new BadRequestException('Stripe payments are only available for events and tours');
    }

    const organizer =
      order.orderType === OrderType.DISTILLERY_TOUR
        ? order.distillery?.owner
        : order.event?.owner;

    if (!organizer) {
      throw new BadRequestException('Organizer not found for this order');
    }

    // Get or create Stripe account for organizer
    let stripeAccount = await this.stripeAccountRepository.findOne({ 
      where: { userId: organizer.id } 
    });

    if (!stripeAccount) {
      stripeAccount = await this.createConnectAccount(organizer.id);
    }

    // Check if account is ready
    const accountStatus = await this.getAccountStatus(organizer.id);
    if (accountStatus.status !== StripeAccountStatus.ENABLED) {
      throw new BadRequestException('Organizer account is not ready to receive payments');
    }

    const idempotencyKey = `payment_${orderId}_${uuidv4()}`;
    const baseAmount = this.roundToCents(parseFloat(order.totalAmount.toString()) || 0);
    if (baseAmount <= 0) {
      throw new BadRequestException('Order amount must be greater than 0');
    }
    const ticketQuantity = order.numberOfGuests > 0 ? order.numberOfGuests : 1;
    const perTicketPrice = baseAmount / ticketQuantity;
    const bookingFeePerTicket = await this.getBookingFee(perTicketPrice);
    const bookingFeeTotal = this.roundToCents(bookingFeePerTicket * ticketQuantity);
    const commissionRate = await this.getCommissionRate(order);
    const commissionAmount = this.roundToCents(baseAmount * commissionRate);
    const platformFee = this.roundToCents(commissionAmount + bookingFeeTotal);
    const organizerEarnings = this.roundToCents(baseAmount - commissionAmount);
    const totalCharge = this.roundToCents(baseAmount + bookingFeeTotal);
    const chargeCurrency = currency || this.defaultCurrency;

    try {
      // Create payment intent with application fee
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: Math.round(totalCharge * 100), // Convert to cents
          currency: chargeCurrency,
          application_fee_amount: Math.round(platformFee * 100),
          transfer_data: {
            destination: stripeAccount.stripeAccountId,
          },
          metadata: {
            orderId: orderId.toString(),
            userId: organizer.id.toString(),
            type: order.orderType,
            ticketTotal: baseAmount.toFixed(2),
            ticketQuantity: ticketQuantity.toString(),
            bookingFeeTotal: bookingFeeTotal.toFixed(2),
            commissionRate: commissionRate.toString(),
            commissionAmount: commissionAmount.toFixed(2),
          },
        },
        {
          idempotencyKey,
        }
      );

      // Create ledger entry
      const ledgerEntry = this.transactionLedgerRepository.create({
        idempotencyKey,
        type: TransactionType.PAYMENT,
        status: TransactionStatus.PENDING,
        userId: organizer.id,
        orderId: order.id,
        amount: totalCharge,
        platformFee,
        organizerEarnings,
        stripePaymentIntentId: paymentIntent.id,
        currency: chargeCurrency,
        description: `Payment for order #${orderId}`,
        metadata: {
          orderId,
          eventId: order.eventId,
          orderType: order.orderType,
          ticketTotal: baseAmount,
          ticketQuantity,
          bookingFeeTotal,
          commissionRate,
          commissionAmount,
        },
      });

      await this.transactionLedgerRepository.save(ledgerEntry);

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      this.logger.error(`Error creating payment intent: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Handle successful payment (called from webhook)
   */
  async handlePaymentSuccess(paymentIntentId: string): Promise<void> {
    const ledgerEntry = await this.transactionLedgerRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
      relations: ['user', 'order'],
    });

    if (!ledgerEntry) {
      this.logger.warn(`Payment intent ${paymentIntentId} not found in ledger`);
      return;
    }

    if (ledgerEntry.status === TransactionStatus.COMPLETED) {
      this.logger.warn(`Payment ${paymentIntentId} already processed`);
      return;
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      const charge = paymentIntent.latest_charge as Stripe.Charge;

      ledgerEntry.status = TransactionStatus.COMPLETED;
      ledgerEntry.stripeChargeId = typeof charge === 'string' ? charge : charge.id;

      // Update user balance
      if (ledgerEntry.user) {
        const user = await this.userRepository.findOne({ where: { id: ledgerEntry.user.id } });
        if (user) {
          user.availableBalance = (parseFloat(user.availableBalance.toString()) || 0) + ledgerEntry.organizerEarnings;
          const ticketTotal = parseFloat(ledgerEntry.metadata?.ticketTotal?.toString() || '') || ledgerEntry.amount;
          user.totalRevenue = (parseFloat(user.totalRevenue.toString()) || 0) + ticketTotal;
          await this.userRepository.save(user);
        }
      }

      // Update order status
      if (ledgerEntry.order) {
        ledgerEntry.order.status = OrderStatus.CONFIRMED;
        ledgerEntry.order.isPaid = true;
        await this.orderRepository.save(ledgerEntry.order);
      }

      await this.transactionLedgerRepository.save(ledgerEntry);

      // Send notifications and emails
      if (ledgerEntry.user && ledgerEntry.order) {
        const notification = await this.createNotification(
          ledgerEntry.user.id,
          NotificationType.BOOKING_RECEIVED,
          `New booking received for order #${ledgerEntry.orderId}`,
          `You have received a new booking worth $${ledgerEntry.amount.toFixed(2)}`,
          { orderId: ledgerEntry.orderId, amount: ledgerEntry.amount },
        );

        // Send email to organizer
        if (notification && ledgerEntry.user.email) {
          const emailSent = await this.emailService.sendBookingReceived(
            ledgerEntry.user.email,
            `${ledgerEntry.user.firstName} ${ledgerEntry.user.lastName}`,
            ledgerEntry.orderId,
            ledgerEntry.order.event?.name || 'Event',
            ledgerEntry.amount,
            ledgerEntry.order.customerName,
          );
          if (emailSent) {
            notification.emailSent = true;
            await this.notificationRepository.save(notification);
          }
        }
      }

      // Send confirmation email to customer
      if (ledgerEntry.order) {
      const emailSent = await this.emailService.sendBookingConfirmation(
          ledgerEntry.order.customerEmail,
          ledgerEntry.order.customerName,
          ledgerEntry.orderId,
          ledgerEntry.order.event?.name || 'Event',
          ledgerEntry.amount,
          ledgerEntry.order.bookingDate?.toString() || '',
          ledgerEntry.order.bookingTime || '',
        );
        // Note: Customer notifications are stored separately if they have a user account
      }
    } catch (error) {
      this.logger.error(`Error processing payment success: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Request payout
   */
  async requestPayout(userId: number, amount: number, reason?: string): Promise<Payout> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has Stripe account
    const stripeAccount = await this.stripeAccountRepository.findOne({ where: { userId } });
    if (!stripeAccount) {
      throw new BadRequestException('Stripe account not found. Please complete onboarding first.');
    }

    // Check KYC status
    const accountStatus = await this.getAccountStatus(userId);
    if (accountStatus.kycStatus !== KYCStatus.VERIFIED) {
      throw new BadRequestException('KYC verification must be completed before requesting payouts');
    }

    // Check available balance
    const availableBalance = parseFloat(user.availableBalance.toString()) || 0;
    if (amount > availableBalance) {
      throw new BadRequestException('Insufficient balance');
    }

    if (amount <= 0) {
      throw new BadRequestException('Payout amount must be greater than 0');
    }

    // Create payout request
    const payout = this.payoutRepository.create({
      userId,
      status: PayoutStatus.PENDING_SUPER_ADMIN_APPROVAL,
      amount,
      currency: this.defaultCurrency,
      reason,
      requestedBy: userId,
      requestedAt: new Date(),
    });

    const savedPayout = await this.payoutRepository.save(payout);

    // Send notification to super admin
    await this.createNotification(
      null, // Will need to find super admin
      NotificationType.PAYOUT_APPROVED, // Actually should be a new type for pending approval
      `Payout request from ${user.firstName} ${user.lastName}`,
      `A payout request of $${amount.toFixed(2)} requires your approval`,
      { payoutId: savedPayout.id, userId, amount },
    );

    return savedPayout;
  }

  /**
   * Approve payout (Super Admin only)
   */
  async approvePayout(payoutId: number, approvedBy: number): Promise<Payout> {
    const payout = await this.payoutRepository.findOne({ 
      where: { id: payoutId },
      relations: ['user'],
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== PayoutStatus.PENDING_SUPER_ADMIN_APPROVAL) {
      throw new BadRequestException('Payout is not pending approval');
    }

    const stripeAccount = await this.stripeAccountRepository.findOne({
      where: { userId: payout.userId },
    });

    if (!stripeAccount) {
      throw new NotFoundException('Stripe account not found');
    }

    try {
      // Create Stripe transfer (payout)
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(payout.amount * 100),
        currency: payout.currency || this.defaultCurrency,
        destination: stripeAccount.stripeAccountId,
        metadata: {
          payoutId: payoutId.toString(),
          userId: payout.userId.toString(),
        },
      });

      payout.status = PayoutStatus.PROCESSING;
      payout.stripePayoutId = transfer.id;
      payout.approvedBy = approvedBy;
      payout.approvedAt = new Date();

      // Update user balance
      const user = await this.userRepository.findOne({ where: { id: payout.userId } });
      if (user) {
        user.availableBalance = Math.max(0, (parseFloat(user.availableBalance.toString()) || 0) - payout.amount);
        user.pendingBalance = (parseFloat(user.pendingBalance.toString()) || 0) + payout.amount;
        await this.userRepository.save(user);
      }

      await this.payoutRepository.save(payout);

      // Create ledger entry
      const idempotencyKey = `payout_${payoutId}_${uuidv4()}`;
      const ledgerEntry = this.transactionLedgerRepository.create({
        idempotencyKey,
        type: TransactionType.PAYOUT,
        status: TransactionStatus.PENDING,
        userId: payout.userId,
        amount: payout.amount,
        platformFee: 0,
        organizerEarnings: -payout.amount,
        stripePayoutId: transfer.id,
        currency: payout.currency || this.defaultCurrency,
        description: `Payout #${payoutId}`,
        metadata: { payoutId },
      });

      await this.transactionLedgerRepository.save(ledgerEntry);

      // Send notification and email
      const notification = await this.createNotification(
        payout.userId,
        NotificationType.PAYOUT_APPROVED,
        'Payout approved',
        `Your payout request of $${payout.amount.toFixed(2)} has been approved and is being processed`,
        { payoutId: payout.id, amount: payout.amount },
      );

      if (notification && payout.user) {
        const emailSent = await this.emailService.sendPayoutNotification(
          payout.user.email,
          `${payout.user.firstName} ${payout.user.lastName}`,
          payout.id,
          payout.amount,
          'approved',
        );
        if (emailSent) {
          notification.emailSent = true;
          await this.notificationRepository.save(notification);
        }
      }

      return payout;
    } catch (error) {
      this.logger.error(`Error processing payout: ${error.message}`, error.stack);
      payout.status = PayoutStatus.FAILED;
      await this.payoutRepository.save(payout);
      throw new BadRequestException(`Failed to process payout: ${error.message}`);
    }
  }

  /**
   * Reject payout
   */
  async rejectPayout(payoutId: number, rejectedBy: number, rejectionReason: string): Promise<Payout> {
    const payout = await this.payoutRepository.findOne({ where: { id: payoutId } });
    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    payout.status = PayoutStatus.REJECTED;
    payout.rejectedBy = rejectedBy;
    payout.rejectionReason = rejectionReason;
    await this.payoutRepository.save(payout);

    // Send notification and email
    const payoutUser = await this.userRepository.findOne({ where: { id: payout.userId } });
    const notification = await this.createNotification(
      payout.userId,
      NotificationType.PAYOUT_REJECTED,
      'Payout rejected',
      `Your payout request of $${payout.amount.toFixed(2)} has been rejected. Reason: ${rejectionReason}`,
      { payoutId: payout.id, amount: payout.amount, reason: rejectionReason },
    );

    if (notification && payoutUser) {
      const emailSent = await this.emailService.sendPayoutNotification(
        payoutUser.email,
        `${payoutUser.firstName} ${payoutUser.lastName}`,
        payout.id,
        payout.amount,
        'rejected',
        rejectionReason,
      );
      if (emailSent) {
        notification.emailSent = true;
        await this.notificationRepository.save(notification);
      }
    }

    return payout;
  }

  /**
   * Request refund
   */
  async requestRefund(orderId: number, amount: number, type: RefundType, requestedBy: number, reason?: string): Promise<Refund> {
    const order = await this.orderRepository.findOne({ 
      where: { id: orderId },
      relations: ['event', 'bar', 'distillery'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Default policy: 48h before event/booking date; vendors can override refundWindowHours.
    const bookingDate = order.bookingDate ? new Date(order.bookingDate) : null;
    if (bookingDate) {
      const vendorConfiguredWindow =
        (order.event as any)?.refundWindowHours ??
        (order.bar as any)?.refundWindowHours ??
        (order.distillery as any)?.refundWindowHours ??
        48;
      const refundCutoff = new Date(bookingDate.getTime() - vendorConfiguredWindow * 60 * 60 * 1000);
      if (Date.now() > refundCutoff.getTime()) {
        throw new BadRequestException(
          `Refund window has passed. Refund requests must be made at least ${vendorConfiguredWindow} hours before the booking date.`,
        );
      }
    }

    // Find original transaction
    const originalTransaction = await this.transactionLedgerRepository.findOne({
      where: { orderId, type: TransactionType.PAYMENT, status: TransactionStatus.COMPLETED },
    });

    if (!originalTransaction) {
      throw new BadRequestException('Original payment transaction not found');
    }

    if (type === RefundType.FULL) {
      amount = originalTransaction.amount;
    } else if (amount > originalTransaction.amount) {
      throw new BadRequestException('Refund amount cannot exceed original payment');
    }

    // Check if refund already exists
    const existingRefund = await this.refundRepository.findOne({
      where: { orderId, status: RefundStatus.COMPLETED },
    });

    if (existingRefund) {
      throw new BadRequestException('Refund already processed for this order');
    }

    const refund = this.refundRepository.create({
      orderId,
      originalTransactionId: originalTransaction.id,
      type,
      status: RefundStatus.PENDING_SUPER_ADMIN_APPROVAL,
      amount,
        currency: originalTransaction.currency || this.defaultCurrency,
      reason,
      requestedBy,
      requestedAt: new Date(),
    });

    return await this.refundRepository.save(refund);
  }

  /**
   * Process refund (Super Admin approval)
   */
  async processRefund(refundId: number, approvedBy: number): Promise<Refund> {
    const refund = await this.refundRepository.findOne({
      where: { id: refundId },
      relations: ['order', 'originalTransaction', 'originalTransaction.user'],
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.status !== RefundStatus.PENDING_SUPER_ADMIN_APPROVAL) {
      throw new BadRequestException('Refund is not pending approval');
    }

    try {
      // Create Stripe refund
      const stripeRefund = await this.stripe.refunds.create({
        payment_intent: refund.originalTransaction.stripePaymentIntentId,
        amount: Math.round(refund.amount * 100),
        metadata: {
          refundId: refundId.toString(),
          orderId: refund.orderId.toString(),
        },
      });

      refund.status = RefundStatus.COMPLETED;
      refund.stripeRefundId = stripeRefund.id;
      refund.approvedBy = approvedBy;
      refund.processedAt = new Date();

      await this.refundRepository.save(refund);

      // Update ledger
      const idempotencyKey = `refund_${refundId}_${uuidv4()}`;
      const originalAmount = parseFloat(refund.originalTransaction.amount.toString()) || 0;
      const originalPlatformFee = parseFloat(refund.originalTransaction.platformFee.toString()) || 0;
      const platformFeeRefund = originalAmount > 0
        ? this.roundToCents((refund.amount / originalAmount) * originalPlatformFee)
        : 0;
      const organizerRefund = this.roundToCents(refund.amount - platformFeeRefund);

      const ledgerEntry = this.transactionLedgerRepository.create({
        idempotencyKey,
        type: TransactionType.REFUND,
        status: TransactionStatus.COMPLETED,
        userId: refund.originalTransaction.userId,
        orderId: refund.orderId,
        amount: -refund.amount,
        platformFee: -platformFeeRefund,
        organizerEarnings: -organizerRefund,
        stripeRefundId: stripeRefund.id,
        currency: refund.currency,
        description: `Refund for order #${refund.orderId}`,
        metadata: { refundId, orderId: refund.orderId },
      });

      await this.transactionLedgerRepository.save(ledgerEntry);

      // Update user balance
      if (refund.originalTransaction.user) {
        const user = await this.userRepository.findOne({ where: { id: refund.originalTransaction.userId } });
        if (user) {
          user.availableBalance = Math.max(0, (parseFloat(user.availableBalance.toString()) || 0) - organizerRefund);
          await this.userRepository.save(user);
        }
      }

      // Update order status
      refund.order.status = OrderStatus.CANCELLED;
      await this.orderRepository.save(refund.order);

      // Send notifications and emails
      if (refund.originalTransaction.user) {
        const notification = await this.createNotification(
          refund.originalTransaction.userId,
          NotificationType.REFUND_PROCESSED,
          'Refund processed',
          `A refund of $${refund.amount.toFixed(2)} has been processed for order #${refund.orderId}`,
          { refundId: refund.id, orderId: refund.orderId, amount: refund.amount },
        );

        if (notification && refund.originalTransaction.user) {
          const emailSent = await this.emailService.sendRefundProcessed(
            refund.originalTransaction.user.email,
            `${refund.originalTransaction.user.firstName} ${refund.originalTransaction.user.lastName}`,
            refund.orderId,
            refund.amount,
            false,
          );
          if (emailSent) {
            notification.emailSent = true;
            await this.notificationRepository.save(notification);
          }
        }
      }

      // Send email to customer
      if (refund.order) {
        await this.emailService.sendRefundProcessed(
          refund.order.customerEmail,
          refund.order.customerName,
          refund.orderId,
          refund.amount,
          true,
        );
      }

      return refund;
    } catch (error) {
      this.logger.error(`Error processing refund: ${error.message}`, error.stack);
      refund.status = RefundStatus.FAILED;
      await this.refundRepository.save(refund);
      throw new BadRequestException(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Create notification
   */
  async createNotification(
    userId: number | null,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<Notification | null> {
    if (!userId) {
      // For customer notifications, we'd need to find user by email from order
      // For now, skip if no userId
      return null;
    }

    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      metadata,
      emailSent: false,
      pushSent: false,
    });

    return await this.notificationRepository.save(notification);
  }

  /**
   * Send KYC incomplete reminder email
   */
  async sendKYCIncompleteReminder(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return;
    }

    const stripeAccount = await this.stripeAccountRepository.findOne({ where: { userId } });
    if (!stripeAccount) {
      return;
    }

    const accountStatus = await this.getAccountStatus(userId);
    if (accountStatus.kycStatus === KYCStatus.VERIFIED) {
      return; // Already verified
    }

    const missingRequirements = accountStatus.verificationDetails?.currentlyDue || [];
    if (missingRequirements.length > 0) {
      await this.emailService.sendKYCIncompleteReminder(
        user.email,
        `${user.firstName} ${user.lastName}`,
        missingRequirements,
      );

      // Create notification
      const notification = await this.createNotification(
        userId,
        NotificationType.KYC_INCOMPLETE,
        'KYC Verification Incomplete',
        `Please complete your Stripe onboarding to enable payouts. ${missingRequirements.length} requirement(s) pending.`,
        { missingRequirements },
      );

      if (notification) {
        notification.emailSent = true;
        await this.notificationRepository.save(notification);
      }
    }
  }

  /**
   * Update payout status from webhook and send email
   */
  async updatePayoutStatusFromWebhook(
    stripePayoutId: string,
    status: 'paid' | 'failed',
  ): Promise<void> {
    const payout = await this.payoutRepository.findOne({
      where: { stripePayoutId },
      relations: ['user'],
    });

    if (!payout) {
      this.logger.warn(`Payout not found for Stripe ID: ${stripePayoutId}`);
      return;
    }

    payout.status = status === 'paid' ? PayoutStatus.PAID : PayoutStatus.FAILED;
    payout.processedAt = new Date();
    await this.payoutRepository.save(payout);

    // Update user balance if paid
    if (status === 'paid' && payout.user) {
      const user = await this.userRepository.findOne({ where: { id: payout.userId } });
      if (user) {
        user.pendingBalance = Math.max(0, (parseFloat(user.pendingBalance.toString()) || 0) - payout.amount);
        await this.userRepository.save(user);
      }
    }

    // Send email notification
    if (payout.user) {
      const notification = await this.createNotification(
        payout.userId,
        status === 'paid' ? NotificationType.PAYOUT_PAID : NotificationType.PAYOUT_FAILED,
        `Payout ${status}`,
        `Your payout of $${payout.amount.toFixed(2)} has been ${status === 'paid' ? 'successfully processed' : 'failed'}.`,
        { payoutId: payout.id, amount: payout.amount },
      );

      if (notification) {
        const emailSent = await this.emailService.sendPayoutNotification(
          payout.user.email,
          `${payout.user.firstName} ${payout.user.lastName}`,
          payout.id,
          payout.amount,
          status,
        );
        if (emailSent) {
          notification.emailSent = true;
          await this.notificationRepository.save(notification);
        }
      }
    }
  }

  /**
   * Get transactions for a user
   */
  async getTransactions(userId: number, limit: number = 50, offset: number = 0) {
    return await this.transactionLedgerRepository.find({
      where: { userId },
      relations: ['order'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get payouts for a user
   */
  async getPayouts(userId: number | null, limit: number = 50, offset: number = 0) {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    return await this.payoutRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: number, limit: number = 50, offset: number = 0) {
    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.status = 'read' as any;
    notification.readAt = new Date();
    return await this.notificationRepository.save(notification);
  }

  /**
   * Get user financial summary
   */
  async getFinancialSummary(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const transactions = await this.transactionLedgerRepository.find({
      where: { userId },
    });

    const totalRevenue = transactions
      .filter(t => t.type === TransactionType.PAYMENT && t.status === TransactionStatus.COMPLETED)
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const totalPayouts = transactions
      .filter(t => t.type === TransactionType.PAYOUT && t.status === TransactionStatus.COMPLETED)
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);

    const pendingPayouts = await this.payoutRepository.find({
      where: { 
        userId,
        status: PayoutStatus.PENDING_SUPER_ADMIN_APPROVAL,
      },
    });

    const pendingPayoutAmount = pendingPayouts.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
      0,
    );

    return {
      totalRevenue,
      availableBalance: parseFloat(user.availableBalance.toString()) || 0,
      pendingBalance: parseFloat(user.pendingBalance.toString()) || 0,
      totalPayouts,
      pendingPayoutAmount,
      transactionCount: transactions.length,
    };
  }

  async getPricingConfig() {
    const config = await this.getOrCreatePricingConfig();
    return {
      tastingOrBarEventCommissionPercent: parseFloat(config.tastingOrBarEventCommissionPercent.toString()),
      distilleryTourCommissionPercent: parseFloat(config.distilleryTourCommissionPercent.toString()),
      festivalCommissionPercent: parseFloat(config.festivalCommissionPercent.toString()),
      bookingFeeThresholdLow: parseFloat(config.bookingFeeThresholdLow.toString()),
      bookingFeeThresholdMid: parseFloat(config.bookingFeeThresholdMid.toString()),
      bookingFeeLow: parseFloat(config.bookingFeeLow.toString()),
      bookingFeeMid: parseFloat(config.bookingFeeMid.toString()),
      bookingFeeHigh: parseFloat(config.bookingFeeHigh.toString()),
    };
  }

  async updatePricingConfig(partial: Partial<PricingConfig>) {
    const config = await this.getOrCreatePricingConfig();
    Object.assign(config, partial);
    await this.pricingConfigRepository.save(config);
    return this.getPricingConfig();
  }

  async processAutomaticPayouts(mode: 'weekly' | 'event_end') {
    const vendorRoles = [UserRole.BAR, UserRole.DISTILLERY, UserRole.TOUR_OPERATOR, UserRole.EVENT_HOST];
    const vendors = await this.userRepository.find({
      where: { role: In(vendorRoles), isActive: true },
    });

    for (const vendor of vendors) {
      if ((parseFloat(vendor.availableBalance.toString()) || 0) <= 0) {
        continue;
      }
      try {
        if (mode === 'event_end') {
          await this.processEventEndPayout(vendor.id);
        } else {
          await this.processWeeklyPayout(vendor.id);
        }
      } catch (error) {
        this.logger.warn(
          `Automatic payout skipped for user ${vendor.id} (${mode}): ${error.message}`,
        );
      }
    }
  }

  /**
   * Get account login link
   */
  async getAccountLoginLink(userId: number): Promise<string> {
    const account = await this.stripeAccountRepository.findOne({ where: { userId } });
    if (!account) {
      throw new NotFoundException('Stripe account not found');
    }

    const loginLink = await this.stripe.accounts.createLoginLink(account.stripeAccountId);
    account.loginLink = loginLink.url;
    await this.stripeAccountRepository.save(account);

    return loginLink.url;
  }

  private async getCommissionRate(order: Order): Promise<number> {
    const config = await this.getOrCreatePricingConfig();
    const tastingRate = parseFloat(config.tastingOrBarEventCommissionPercent.toString()) / 100;
    const distilleryRate = parseFloat(config.distilleryTourCommissionPercent.toString()) / 100;
    const festivalRate = parseFloat(config.festivalCommissionPercent.toString()) / 100;

    if (order.orderType === OrderType.DISTILLERY_TOUR) {
      return distilleryRate;
    }

    if (order.orderType === OrderType.EVENT_BOOKING) {
      const category = (order.event?.category || order.event?.type || '').toLowerCase();
      if (category.includes('festival')) {
        return festivalRate;
      }
      return tastingRate;
    }

    return tastingRate;
  }

  private async getBookingFee(ticketPrice: number): Promise<number> {
    const config = await this.getOrCreatePricingConfig();
    const lowThreshold = parseFloat(config.bookingFeeThresholdLow.toString());
    const midThreshold = parseFloat(config.bookingFeeThresholdMid.toString());
    const lowFee = parseFloat(config.bookingFeeLow.toString());
    const midFee = parseFloat(config.bookingFeeMid.toString());
    const highFee = parseFloat(config.bookingFeeHigh.toString());

    if (ticketPrice < lowThreshold) {
      return lowFee;
    }
    if (ticketPrice <= midThreshold) {
      return midFee;
    }
    return highFee;
  }

  private roundToCents(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private buildNestedStripeField(path: string, value: string): Record<string, any> {
    const root: Record<string, any> = {};
    const keys = path.split('.');
    let cursor: Record<string, any> = root;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (i === keys.length - 1) {
        cursor[key] = value;
      } else {
        cursor[key] = cursor[key] || {};
        cursor = cursor[key];
      }
    }
    return root;
  }

  private async getOrCreatePricingConfig(): Promise<PricingConfig> {
    let config = await this.pricingConfigRepository.findOne({ where: { id: 1 } });
    if (!config) {
      config = this.pricingConfigRepository.create({
        id: 1,
        tastingOrBarEventCommissionPercent: 6.0,
        distilleryTourCommissionPercent: 8.0,
        festivalCommissionPercent: 5.0,
        bookingFeeThresholdLow: 50.0,
        bookingFeeThresholdMid: 150.0,
        bookingFeeLow: 2.0,
        bookingFeeMid: 3.0,
        bookingFeeHigh: 4.0,
      });
      config = await this.pricingConfigRepository.save(config);
    }
    return config;
  }

  private async processWeeklyPayout(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;
    const available = parseFloat(user.availableBalance.toString()) || 0;
    if (available <= 0) return;
    await this.createAndProcessAutomaticPayout(userId, available, 'Weekly automatic payout', {
      trigger: 'weekly',
    });
  }

  private async processEventEndPayout(userId: number) {
    const endedOrders = await this.orderRepository.find({
      where: {
        isPaid: true,
        autoPayoutProcessed: false,
        status: In([OrderStatus.CONFIRMED, OrderStatus.COMPLETED]),
      },
      relations: ['event', 'distillery'],
    });

    const userEndedOrders = endedOrders.filter((order) => {
      const bookingDate = order.bookingDate ? new Date(order.bookingDate).getTime() : 0;
      const isEnded = bookingDate > 0 && bookingDate <= Date.now();
      const ownerId =
        order.orderType === OrderType.DISTILLERY_TOUR
          ? order.distillery?.userId
          : order.event?.userId;
      return isEnded && ownerId === userId;
    });

    if (userEndedOrders.length === 0) return;

    const orderIds = userEndedOrders.map((o) => o.id);
    const ledgers = await this.transactionLedgerRepository.find({
      where: {
        orderId: In(orderIds),
        userId,
        type: TransactionType.PAYMENT,
        status: TransactionStatus.COMPLETED,
      },
    });
    const payoutAmount = this.roundToCents(
      ledgers.reduce((sum, item) => sum + (parseFloat(item.organizerEarnings.toString()) || 0), 0),
    );

    if (payoutAmount <= 0) return;

    await this.createAndProcessAutomaticPayout(userId, payoutAmount, 'Automatic payout after event completion', {
      trigger: 'event_end',
      orderIds,
    });

    for (const order of userEndedOrders) {
      order.autoPayoutProcessed = true;
    }
    await this.orderRepository.save(userEndedOrders);
  }

  private async createAndProcessAutomaticPayout(
    userId: number,
    amount: number,
    reason: string,
    metadata: Record<string, any>,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;
    const stripeAccount = await this.stripeAccountRepository.findOne({ where: { userId } });
    if (!stripeAccount) return;
    const accountStatus = await this.getAccountStatus(userId);
    if (accountStatus.kycStatus !== KYCStatus.VERIFIED) return;

    const payout = this.payoutRepository.create({
      userId,
      status: PayoutStatus.PROCESSING,
      amount,
      currency: this.defaultCurrency,
      reason,
      requestedBy: userId,
      approvedBy: userId,
      requestedAt: new Date(),
      approvedAt: new Date(),
      metadata,
    });
    const savedPayout = await this.payoutRepository.save(payout);

    const transfer = await this.stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: this.defaultCurrency,
      destination: stripeAccount.stripeAccountId,
      metadata: {
        payoutId: savedPayout.id.toString(),
        userId: userId.toString(),
        auto: 'true',
      },
    });

    savedPayout.stripePayoutId = transfer.id;
    await this.payoutRepository.save(savedPayout);

    user.availableBalance = Math.max(0, (parseFloat(user.availableBalance.toString()) || 0) - amount);
    user.pendingBalance = (parseFloat(user.pendingBalance.toString()) || 0) + amount;
    await this.userRepository.save(user);
  }
}
