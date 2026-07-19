import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BarsModule } from './bars/bars.module';
import { DistilleriesModule } from './distilleries/distilleries.module';
import { EventsModule } from './events/events.module';
import { BlogsModule } from './blogs/blogs.module';
import { HomepageModule } from './homepage/homepage.module';
import { PlatformConfigModule } from './platform-config/platform-config.module';
import { CustomersModule } from './customers/customers.module';
import { UploadModule } from './upload/upload.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { OrdersModule } from './orders/orders.module';
import { StripeModule } from './stripe/stripe.module';
import { EmailModule } from './email/email.module';
import { AdminModule } from './admin/admin.module';
import { BannersModule } from './banners/banners.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DestinationsModule } from './destinations/destinations.module';
import { BadgesModule } from './badges/badges.module';
import { ClaimsModule } from './claims/claims.module';
import { SessionsModule } from './sessions/sessions.module';

// Entities
import { User } from './users/entities/user.entity';
import { Bar } from './bars/entities/bar.entity';
import { Distillery } from './distilleries/entities/distillery.entity';
import { Event } from './events/entities/event.entity';
import { Blog } from './blogs/entities/blog.entity';
import { HomepageContent } from './homepage/entities/homepage-content.entity';
import { Order } from './orders/entities/order.entity';
import { StripeAccount } from './stripe/entities/stripe-account.entity';
import { TransactionLedger } from './stripe/entities/transaction-ledger.entity';
import { Payout } from './stripe/entities/payout.entity';
import { Refund } from './stripe/entities/refund.entity';
import { Notification } from './stripe/entities/notification.entity';
import { PricingConfig } from './stripe/entities/pricing-config.entity';
import { PlatformConfig } from './platform-config/entities/platform-config.entity';
import { Customer } from './customers/entities/customer.entity';
import { Banner } from './banners/entities/banner.entity';
import { Review } from './reviews/entities/review.entity';
import { VerifiedVisit } from './reviews/entities/verified-visit.entity';
import { ReviewReport } from './reviews/entities/review-report.entity';
import { Badge } from './badges/entities/badge.entity';
import { Claim } from './claims/entities/claim.entity';
import { Session } from './sessions/entities/session.entity';
import { Feedback } from './feedback/entities/feedback.entity';
import { AnalyticsEvent } from './analytics/entities/analytics-event.entity';

/** The resolved database target. DATABASE_URL wins over the DB_* vars. */
const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USERNAME || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${
    process.env.DB_HOST || 'localhost'
  }:${process.env.DB_PORT || 5432}/${process.env.DB_DATABASE || 'byfoods_cms'}`;

/**
 * Parse the URL into explicit connection fields.
 *
 * TypeORM's own URL parser mishandles the Supabase pooler username
 * `postgres.<project-ref>` — it connected as bare `postgres`, which the server
 * rejects. Passing host/username/password explicitly (via Node's URL parser,
 * which keeps the dotted username intact) sidesteps that entirely.
 */
function parseDbUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? parseInt(u.port, 10) : 5432,
    username: decodeURIComponent(u.username) || 'postgres',
    password: decodeURIComponent(u.password) || '',
    database: u.pathname.replace(/^\//, '') || 'postgres',
  };
}

const db = parseDbUrl(databaseUrl);

/** Hosted Postgres (Supabase / Neon / RDS) needs TLS; a local one must not use it. */
const isHosted = !/^(localhost|127\.0\.0\.1|\[?::1\]?)$/.test(db.host);

/**
 * Refuse to auto-sync the schema of a hosted database by accident.
 *
 * DB_SYNCHRONIZE=true against a hosted database is how a client's schema gets
 * silently ALTERed — and columns DROPPED — by a developer just starting the
 * API. It stays blocked unless CONFIRM_HOSTED_SYNC=true is also set, which is
 * the explicit "yes, sync this hosted database on purpose" acknowledgement
 * (used once to create the schema on a brand-new, empty database).
 */
if (
  process.env.DB_SYNCHRONIZE === 'true' &&
  isHosted &&
  process.env.CONFIRM_HOSTED_SYNC !== 'true'
) {
  throw new Error(
    `Refusing to start: DB_SYNCHRONIZE=true against a hosted database (${db.host}).\n` +
      `TypeORM would ALTER — and can DROP columns from — this schema on boot.\n` +
      `If this is a NEW, EMPTY database and you intend to create the schema, set\n` +
      `CONFIRM_HOSTED_SYNC=true as well. Otherwise use backend/scripts/*.sql.`,
  );
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting. One global throttler, generous enough for ordinary browsing
    // (a listing page fires several requests). Sensitive endpoints — login,
    // review/claim/report submission — narrow this same limiter down with their
    // own @Throttle override to a handful per minute, so brute force and spam are
    // throttled without touching normal traffic. Keyed by IP, which is real
    // because main.ts trusts one proxy hop.
    //
    // A single named throttler on purpose: extra named throttlers in forRoot
    // apply to EVERY route at once, so a "strict" band here would silently cap
    // all browsing at its low limit.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 300 }]),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      // Explicit fields, not `url:` — see parseDbUrl above (pooler username fix).
      host: db.host,
      port: db.port,
      username: db.username,
      password: db.password,
      database: db.database,
      entities: [
        User, 
        Bar, 
        Distillery, 
        Event, 
        Blog, 
        HomepageContent, 
        Order,
        StripeAccount,
        TransactionLedger,
        Payout,
        Refund,
        Notification,
        PricingConfig,
        PlatformConfig,
        Customer,
        Banner,
        Review,
        // This list is hand-maintained — an entity missing from it registers
        // nowhere, and the first query against it dies at runtime with
        // "No metadata for X was found" rather than at build time.
        VerifiedVisit,
        ReviewReport,
        Badge,
        Claim,
        Session,
        Feedback,
        AnalyticsEvent,
      ],
      /**
       * Schema auto-sync is now explicit opt-in, and defaults to OFF.
       *
       * This was `NODE_ENV === 'development'`, which is a trap: NODE_ENV is
       * 'development' on every developer's machine, while DATABASE_URL points at
       * a hosted Supabase database. So simply starting the API locally handed
       * TypeORM permission to ALTER a live schema — and synchronize drops columns
       * it doesn't recognise, so it can destroy data, not just add to it.
       *
       * Set DB_SYNCHRONIZE=true only when the target is a throwaway local
       * database. For hosted databases use the SQL in backend/scripts/ instead.
       */
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.NODE_ENV === 'development',
      /**
       * SSL follows the host, not NODE_ENV. Hosted Postgres (Supabase, Neon,
       * RDS) requires TLS, so keying this off NODE_ENV meant a local run against
       * a hosted database could not connect at all.
       */
      ssl: isHosted ? { rejectUnauthorized: false } : false,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    UsersModule,
    BarsModule,
    DistilleriesModule,
    EventsModule,
    BlogsModule,
    HomepageModule,
    UploadModule,
    CloudinaryModule,
    OrdersModule,
    StripeModule,
    EmailModule,
    PlatformConfigModule,
    CustomersModule,
    AdminModule,
    BannersModule,
    NotificationsModule,
    ReviewsModule,
    FeedbackModule,
    AnalyticsModule,
    DestinationsModule,
    BadgesModule,
    ClaimsModule,
    SessionsModule,
  ],
  providers: [
    // Apply the rate limiter to every route by default. Endpoints that must not
    // be throttled (the Stripe webhook, which retries) opt out with @SkipThrottle.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
