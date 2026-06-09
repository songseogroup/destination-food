import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Delete,
  Body, 
  Param, 
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlatformConfigService } from './platform-config.service';
import { PlatformConfig, ConfigType } from './entities/platform-config.entity';
import { CreateConfigDto } from './dto/create-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Platform Config')
@Controller('platform-config')
export class PlatformConfigController {
  constructor(private readonly configService: PlatformConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get all platform configs' })
  @ApiResponse({ status: 200, description: 'Configs retrieved successfully' })
  @ApiQuery({ name: 'type', required: false, enum: ConfigType })
  async findAll(@Query('type') type?: ConfigType): Promise<PlatformConfig[]> {
    return this.configService.findAll(type);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all active categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories(): Promise<PlatformConfig[]> {
    return this.configService.findByType(ConfigType.CATEGORY);
  }

  @Get('how-it-works')
  @ApiOperation({ summary: 'Get How It Works steps' })
  @ApiResponse({ status: 200, description: 'Steps retrieved successfully' })
  async getHowItWorks(): Promise<PlatformConfig[]> {
    return this.configService.findByType(ConfigType.HOW_IT_WORKS_STEP);
  }

  @Get('business-types')
  @ApiOperation({ summary: 'Get business types for registration' })
  @ApiResponse({ status: 200, description: 'Business types retrieved successfully' })
  async getBusinessTypes(): Promise<PlatformConfig[]> {
    return this.configService.findByType(ConfigType.BUSINESS_TYPE);
  }

  @Get('experience-types')
  @ApiOperation({ summary: 'Get experience types' })
  @ApiResponse({ status: 200, description: 'Experience types retrieved successfully' })
  async getExperienceTypes(): Promise<PlatformConfig[]> {
    return this.configService.findByType(ConfigType.EXPERIENCE_TYPE);
  }

  @Get('currencies')
  @ApiOperation({ summary: 'Get supported currencies' })
  @ApiResponse({ status: 200, description: 'Currencies retrieved successfully' })
  async getCurrencies(): Promise<PlatformConfig[]> {
    return this.configService.findByType(ConfigType.CURRENCY);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create platform config (Admin only)' })
  @ApiResponse({ status: 201, description: 'Config created successfully' })
  async create(@Body() createDto: CreateConfigDto): Promise<PlatformConfig> {
    return this.configService.create(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update platform config (Admin only)' })
  @ApiResponse({ status: 200, description: 'Config updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Partial<CreateConfigDto>,
  ): Promise<PlatformConfig> {
    return this.configService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete platform config (Admin only)' })
  @ApiResponse({ status: 200, description: 'Config deleted successfully' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.configService.delete(id);
  }
}
