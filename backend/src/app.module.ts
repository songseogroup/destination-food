import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || `postgresql://${process.env.DB_USERNAME || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_DATABASE || 'byfoods_cms'}`,
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
      ],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
  ],
})
export class AppModule {}
