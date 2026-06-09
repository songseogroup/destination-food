import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('pricing_configs')
export class PricingConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 6.0 })
  tastingOrBarEventCommissionPercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 8.0 })
  distilleryTourCommissionPercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5.0 })
  festivalCommissionPercent: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 50.0 })
  bookingFeeThresholdLow: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 150.0 })
  bookingFeeThresholdMid: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 2.0 })
  bookingFeeLow: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 3.0 })
  bookingFeeMid: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 4.0 })
  bookingFeeHigh: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
