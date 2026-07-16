import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { HomepageContent } from './entities/homepage-content.entity';
import { ReorderHomepageDto, UpdateHomepageContentDto } from './dto/update-homepage-content.dto';

/**
 * Blocks that must always exist on the homepage. They can be reordered and
 * hidden, but not deleted — removing them would leave the site with no way to
 * get them back short of a DB write.
 */
const FIXED_SECTIONS = [
  'banner',
  'featured_bars',
  'featured_distilleries',
  'featured_events',
  'featured_blogs',
];

@Injectable()
export class HomepageService {
  constructor(
    @InjectRepository(HomepageContent)
    private homepageContentRepository: Repository<HomepageContent>,
    private dataSource: DataSource,
  ) {}

  /**
   * Ordered layout. `order` ASC is what the storefront renders by; createdAt is
   * only a tiebreaker for rows seeded before ordering existed (all default 0).
   */
  async findAll(): Promise<HomepageContent[]> {
    return this.homepageContentRepository.find({
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  /** Visible blocks only — what the public homepage actually renders. */
  async findPublicLayout(): Promise<HomepageContent[]> {
    return this.homepageContentRepository.find({
      where: { isVisible: true },
      order: { order: 'ASC', createdAt: 'ASC' },
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
      // New block (e.g. an ad slot the builder just added). Append it to the end
      // rather than defaulting to 0, which would silently jump it to the top.
      const max = await this.homepageContentRepository
        .createQueryBuilder('h')
        .select('MAX(h.order)', 'max')
        .getRawOne<{ max: number | null }>();

      content = this.homepageContentRepository.create({
        section: updateDto.section,
        content: updateDto.content,
        order: updateDto.order ?? (max?.max ?? -1) + 1,
        isVisible: updateDto.isVisible ?? true,
      });
    } else {
      content.content = updateDto.content;
      if (updateDto.order !== undefined) content.order = updateDto.order;
      if (updateDto.isVisible !== undefined) content.isVisible = updateDto.isVisible;
    }

    return this.homepageContentRepository.save(content);
  }

  /**
   * Applies a whole drag-and-drop ordering in one transaction.
   *
   * All-or-nothing on purpose: a partial write would leave the homepage in an
   * order the admin never chose, and with duplicate `order` values the rendered
   * result becomes arbitrary rather than merely wrong.
   */
  async reorder(dto: ReorderHomepageDto): Promise<HomepageContent[]> {
    const keys = dto.sections.map((s) => s.section);
    const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
    if (duplicates.length) {
      throw new BadRequestException(`Duplicate sections in reorder: ${duplicates.join(', ')}`);
    }

    const existing = await this.homepageContentRepository.find();
    const known = new Set(existing.map((e) => e.section));
    const unknown = keys.filter((k) => !known.has(k));
    if (unknown.length) {
      throw new BadRequestException(`Unknown sections: ${unknown.join(', ')}`);
    }

    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.sections) {
        await manager.update(
          HomepageContent,
          { section: item.section },
          {
            order: item.order,
            ...(item.isVisible === undefined ? {} : { isVisible: item.isVisible }),
          },
        );
      }
    });

    return this.findAll();
  }

  /** Removes a block. Fixed blocks can only be hidden, never deleted. */
  async remove(section: string): Promise<{ message: string }> {
    if (FIXED_SECTIONS.includes(section)) {
      throw new BadRequestException(
        `'${section}' is a core section and cannot be removed — hide it instead.`,
      );
    }

    const result = await this.homepageContentRepository.delete({ section });
    if (!result.affected) {
      throw new NotFoundException(`Homepage section '${section}' not found`);
    }
    return { message: `Section '${section}' removed` };
  }

  async initializeDefaultContent(): Promise<void> {
    const defaultSections = [
      {
        section: 'banner',
        order: 0,
        content: {
          highlight: "Australia's whisky marketplace",
          title: 'Find your next',
          subtitle: 'great dram',
          description:
            'Book whisky tastings, distillery tours, bar events and festivals — direct with the people who pour them.',
          backgroundImage:
            'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920&h=1080&fit=crop',
          searchPlaceholder: 'Search tastings, tours, distilleries...',
          popularSearches: ['Sydney', 'Melbourne', 'Hobart'],
        },
      },
      {
        section: 'featured_bars',
        order: 1,
        content: {
          title: 'Featured Whisky Bars',
          description: 'Rare drams, deep back bars, and the people who know them best',
          viewAllLabel: 'View all bars',
          tone: 'cream',
        },
      },
      {
        section: 'ad:featured_above',
        order: 2,
        content: { slot: 'featured_above' },
      },
      {
        section: 'featured_distilleries',
        order: 3,
        content: {
          title: 'Distilleries & Tours',
          description: 'Go behind the still with the makers themselves',
          viewAllLabel: 'View all distilleries',
          tone: 'white',
        },
      },
      {
        section: 'featured_events',
        order: 4,
        content: {
          title: 'Upcoming Whisky Events',
          description: 'Tastings, masterclasses and festivals worth clearing your calendar for',
          viewAllLabel: 'View all events',
          tone: 'cream',
        },
      },
      {
        section: 'featured_blogs',
        order: 5,
        content: {
          title: 'From the Journal',
          description: 'Tasting notes, distillery stories and the odd strong opinion',
          viewAllLabel: 'Read the journal',
          tone: 'white',
        },
      },
    ];

    for (const sectionData of defaultSections) {
      const existing = await this.homepageContentRepository.findOne({
        where: { section: sectionData.section },
      });

      if (!existing) {
        const content = this.homepageContentRepository.create(sectionData);
        await this.homepageContentRepository.save(content);
      }
    }
  }
}
