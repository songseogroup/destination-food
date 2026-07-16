import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { HomepageService } from './homepage.service';
import {
  UpdateHomepageContentDto,
  ReorderHomepageDto,
} from './dto/update-homepage-content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Homepage')
@Controller('homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Get()
  @ApiOperation({ summary: 'Get all homepage content' })
  @ApiResponse({ status: 200, description: 'Homepage content retrieved successfully' })
  async findAll() {
    return this.homepageService.findAll();
  }

  @Get('layout')
  @ApiOperation({ summary: 'Get the ordered, visible homepage layout (Public)' })
  @ApiResponse({ status: 200, description: 'Homepage layout retrieved successfully' })
  async findPublicLayout() {
    return this.homepageService.findPublicLayout();
  }

  @Get(':section')
  @ApiOperation({ summary: 'Get homepage content by section' })
  @ApiResponse({ status: 200, description: 'Homepage content retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Homepage content not found' })
  async findBySection(@Param('section') section: string) {
    return this.homepageService.findBySection(section);
  }

  @Post('update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update homepage content (SuperAdmin only)' })
  @ApiResponse({ status: 200, description: 'Homepage content updated successfully' })
  async update(@Body() updateDto: UpdateHomepageContentDto) {
    return this.homepageService.update(updateDto.section, updateDto);
  }

  @Post('initialize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize default homepage content' })
  @ApiResponse({ status: 200, description: 'Default homepage content initialized successfully' })
  async initializeDefaultContent() {
    await this.homepageService.initializeDefaultContent();
    return { message: 'Default homepage content initialized successfully' };
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder / toggle homepage sections (SuperAdmin only)' })
  @ApiResponse({ status: 200, description: 'Homepage layout updated successfully' })
  async reorder(@Body() dto: ReorderHomepageDto) {
    return this.homepageService.reorder(dto);
  }

  @Delete(':section')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a non-core homepage section (SuperAdmin only)' })
  @ApiResponse({ status: 200, description: 'Section removed successfully' })
  @ApiResponse({ status: 400, description: 'Core sections cannot be removed' })
  async remove(@Param('section') section: string) {
    return this.homepageService.remove(section);
  }
}
