import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformConfig, ConfigType } from './entities/platform-config.entity';
import { CreateConfigDto } from './dto/create-config.dto';

@Injectable()
export class PlatformConfigService {
  constructor(
    @InjectRepository(PlatformConfig)
    private configRepository: Repository<PlatformConfig>,
  ) {}

  async findAll(type?: ConfigType): Promise<PlatformConfig[]> {
    const where: any = { isActive: true };
    if (type) {
      where.type = type;
    }
    return this.configRepository.find({
      where,
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findByType(type: ConfigType): Promise<PlatformConfig[]> {
    return this.configRepository.find({
      where: { type, isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findByKey(key: string): Promise<PlatformConfig | null> {
    return this.configRepository.findOne({
      where: { key, isActive: true },
    });
  }

  async create(createDto: CreateConfigDto): Promise<PlatformConfig> {
    const config = this.configRepository.create(createDto);
    return this.configRepository.save(config);
  }

  async update(id: number, updateDto: Partial<CreateConfigDto>): Promise<PlatformConfig> {
    const config = await this.configRepository.findOne({ where: { id } });
    if (!config) {
      throw new Error('Config not found');
    }
    Object.assign(config, updateDto);
    return this.configRepository.save(config);
  }

  async delete(id: number): Promise<void> {
    await this.configRepository.delete(id);
  }

  async initializeDefaultConfigs(): Promise<void> {
    const defaultConfigs = [
      // Categories
      {
        type: ConfigType.CATEGORY,
        key: 'whisky',
        label: 'Whisky',
        description: 'Premium whisky bars and tastings',
        icon: 'wine',
        sortOrder: 1,
      },
      {
        type: ConfigType.CATEGORY,
        key: 'cocktails',
        label: 'Cocktails',
        description: 'Craft cocktail experiences',
        icon: 'martini',
        sortOrder: 2,
      },
      {
        type: ConfigType.CATEGORY,
        key: 'wine',
        label: 'Wine',
        description: 'Wine bars and tastings',
        icon: 'grape',
        sortOrder: 3,
      },
      {
        type: ConfigType.CATEGORY,
        key: 'beer',
        label: 'Craft Beer',
        description: 'Craft beer and breweries',
        icon: 'beer',
        sortOrder: 4,
      },
      {
        type: ConfigType.CATEGORY,
        key: 'events',
        label: 'Events',
        description: 'Special events and experiences',
        icon: 'calendar',
        sortOrder: 5,
      },
      // How It Works Steps
      {
        type: ConfigType.HOW_IT_WORKS_STEP,
        key: 'step_1',
        label: 'Choose Experience',
        description: 'Browse and select from our curated collection of premium bars, distilleries, and exclusive events.',
        icon: 'search',
        sortOrder: 1,
      },
      {
        type: ConfigType.HOW_IT_WORKS_STEP,
        key: 'step_2',
        label: 'Book Instantly',
        description: 'Reserve your spot with our seamless booking system. Get instant confirmation.',
        icon: 'calendar-check',
        sortOrder: 2,
      },
      {
        type: ConfigType.HOW_IT_WORKS_STEP,
        key: 'step_3',
        label: 'Enjoy & Share',
        description: 'Experience the finest nightlife and share memorable moments with friends.',
        icon: 'star',
        sortOrder: 3,
      },
      // Business Types
      {
        type: ConfigType.BUSINESS_TYPE,
        key: 'bar',
        label: 'Bar',
        sortOrder: 1,
      },
      {
        type: ConfigType.BUSINESS_TYPE,
        key: 'distillery',
        label: 'Distillery',
        sortOrder: 2,
      },
      {
        type: ConfigType.BUSINESS_TYPE,
        key: 'restaurant',
        label: 'Restaurant',
        sortOrder: 3,
      },
      {
        type: ConfigType.BUSINESS_TYPE,
        key: 'event_venue',
        label: 'Event Venue',
        sortOrder: 4,
      },
      {
        type: ConfigType.BUSINESS_TYPE,
        key: 'tour_operator',
        label: 'Tour Operator',
        sortOrder: 5,
      },
      {
        type: ConfigType.BUSINESS_TYPE,
        key: 'other',
        label: 'Other',
        sortOrder: 6,
      },
      // Experience Types
      {
        type: ConfigType.EXPERIENCE_TYPE,
        key: 'tasting',
        label: 'Tasting',
        sortOrder: 1,
      },
      {
        type: ConfigType.EXPERIENCE_TYPE,
        key: 'tour',
        label: 'Tour',
        sortOrder: 2,
      },
      {
        type: ConfigType.EXPERIENCE_TYPE,
        key: 'workshop',
        label: 'Workshop',
        sortOrder: 3,
      },
      {
        type: ConfigType.EXPERIENCE_TYPE,
        key: 'masterclass',
        label: 'Masterclass',
        sortOrder: 4,
      },
      {
        type: ConfigType.EXPERIENCE_TYPE,
        key: 'experience',
        label: 'Experience',
        sortOrder: 5,
      },
      // Currencies
      {
        type: ConfigType.CURRENCY,
        key: 'AUD',
        label: 'AUD ($)',
        value: { symbol: '$', code: 'AUD', name: 'Australian Dollar' },
        sortOrder: 1,
      },
      {
        type: ConfigType.CURRENCY,
        key: 'USD',
        label: 'USD ($)',
        value: { symbol: '$', code: 'USD', name: 'US Dollar' },
        sortOrder: 2,
      },
      {
        type: ConfigType.CURRENCY,
        key: 'EUR',
        label: 'EUR (€)',
        value: { symbol: '€', code: 'EUR', name: 'Euro' },
        sortOrder: 3,
      },
      {
        type: ConfigType.CURRENCY,
        key: 'GBP',
        label: 'GBP (£)',
        value: { symbol: '£', code: 'GBP', name: 'British Pound' },
        sortOrder: 4,
      },
      {
        type: ConfigType.CURRENCY,
        key: 'JPY',
        label: 'JPY (¥)',
        value: { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
        sortOrder: 5,
      },
    ];

    for (const configData of defaultConfigs) {
      const existing = await this.configRepository.findOne({
        where: { key: configData.key, type: configData.type },
      });

      if (!existing) {
        const config = this.configRepository.create(configData as any);
        await this.configRepository.save(config);
      }
    }
  }
}
