import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ConfigType {
  CATEGORY = 'category',
  HOW_IT_WORKS_STEP = 'how_it_works_step',
  COLLECTION = 'collection',
  BUSINESS_TYPE = 'business_type',
  EXPERIENCE_TYPE = 'experience_type',
  CURRENCY = 'currency',
  PLATFORM_SETTING = 'platform_setting',
}

@Entity('platform_configs')
export class PlatformConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ConfigType,
    default: ConfigType.PLATFORM_SETTING,
  })
  type: ConfigType;

  @Column()
  key: string;

  @Column('json', { nullable: true })
  value: any;

  @Column({ nullable: true })
  label: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
