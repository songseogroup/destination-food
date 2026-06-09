import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { HomepageContent } from './entities/homepage-content.entity';
import { UpdateHomepageContentDto } from './dto/update-homepage-content.dto';

@Injectable()
export class HomepageService {
  constructor(
    @InjectRepository(HomepageContent)
    private homepageContentRepository: Repository<HomepageContent>,
  ) {}

  async findAll(): Promise<HomepageContent[]> {
    return this.homepageContentRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  async findBySection(section: string): Promise<HomepageContent> {
    const content = await this.homepageContentRepository.findOne({
      where: { section },
    });
    
    if (!content) {
      throw new NotFoundException(`Homepage content for section '${section}' not found`);
    }
    
    return content;
  }

  async update(section: string, updateDto: UpdateHomepageContentDto): Promise<HomepageContent> {
    let content = await this.homepageContentRepository.findOne({
      where: { section },
    });

    if (!content) {
      content = this.homepageContentRepository.create({
        section: updateDto.section,
        content: updateDto.content,
      });
    } else {
      content.content = updateDto.content;
    }

    return this.homepageContentRepository.save(content);
  }

  async initializeDefaultContent(): Promise<void> {
    const defaultSections = [
      {
        section: 'banner',
        content: {
          title: 'Premium',
          subtitle: 'Nightlife',
          description: 'Discover the finest bars, distilleries, and exclusive events in the city',
          backgroundImage: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920&h=1080&fit=crop',
          primaryButton: {
            text: 'Explore Now',
            link: '/bars'
          },
          secondaryButton: {
            text: 'View Events',
            link: '/events'
          }
        }
      },
      {
        section: 'featured_bars',
        content: {
          title: 'Featured Bars',
          description: 'Experience the finest bars and lounges in the city'
        }
      },
      {
        section: 'featured_distilleries',
        content: {
          title: 'Premium Distilleries',
          description: 'Discover the finest craft spirit producers and their exceptional offerings'
        }
      },
      {
        section: 'featured_events',
        content: {
          title: 'Exclusive Events',
          description: 'Join premium tastings, masterclasses, and social gatherings'
        }
      },
      {
        section: 'featured_blogs',
        content: {
          title: 'Latest Blog Posts',
          description: 'Stay updated with the latest trends in nightlife, spirits, and entertainment'
        }
      }
    ];

    for (const sectionData of defaultSections) {
      const existing = await this.homepageContentRepository.findOne({
        where: { section: sectionData.section }
      });

      if (!existing) {
        const content = this.homepageContentRepository.create(sectionData);
        await this.homepageContentRepository.save(content);
      }
    }
  }
}
