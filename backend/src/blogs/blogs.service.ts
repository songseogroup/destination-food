import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Blog } from './entities/blog.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,
  ) {}

  async create(createBlogDto: CreateBlogDto): Promise<Blog> {
    const blog = this.blogRepository.create(createBlogDto);
    return this.blogRepository.save(blog);
  }

  async findAll(paginationDto: PaginationDto): Promise<{ data: Blog[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const [data, total] = await this.blogRepository.findAndCount({
      where: { isActive: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findFeatured(): Promise<Blog[]> {
    return this.blogRepository.find({
      where: { isActive: true, featured: true },
      take: 3,
      order: { createdAt: 'DESC' },
    });
  }

  async findLatest(): Promise<Blog[]> {
    return this.blogRepository.find({
      where: { isActive: true },
      take: 6,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Blog> {
    const blog = await this.blogRepository.findOne({ 
      where: { id, isActive: true } 
    });
    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
    
    // Increment view count
    blog.views += 1;
    await this.blogRepository.save(blog);
    
    return blog;
  }

  async update(id: number, updateBlogDto: UpdateBlogDto): Promise<Blog> {
    const blog = await this.findOne(id);
    Object.assign(blog, updateBlogDto);
    return this.blogRepository.save(blog);
  }

  async remove(id: number): Promise<void> {
    const blog = await this.findOne(id);
    blog.isActive = false;
    await this.blogRepository.save(blog);
  }

  async search(query: string): Promise<Blog[]> {
    return this.blogRepository
      .createQueryBuilder('blog')
      .where('blog.isActive = :isActive', { isActive: true })
      .andWhere(
        '(blog.title LIKE :query OR blog.excerpt LIKE :query OR blog.content LIKE :query OR blog.category LIKE :query)',
        { query: `%${query}%` }
      )
      .orderBy('blog.createdAt', 'DESC')
      .getMany();
  }

  async findByCategory(category: string): Promise<Blog[]> {
    return this.blogRepository.find({
      where: { category, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getCategories(): Promise<string[]> {
    const result = await this.blogRepository
      .createQueryBuilder('blog')
      .select('DISTINCT blog.category', 'category')
      .where('blog.isActive = :isActive', { isActive: true })
      .getRawMany();
    
    return result.map(item => item.category);
  }
}
