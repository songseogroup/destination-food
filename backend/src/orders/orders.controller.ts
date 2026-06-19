import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Query, 
  UseGuards,
  ParseIntPipe,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order (Customer must be logged in)' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Customer must be logged in' })
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    // req.user.sub contains the customer ID from JWT token
    return this.ordersService.create(createOrderDto, req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders (Role-based filtering)' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query() paginationDto: PaginationDto, @Request() req) {
    return this.ordersService.findAll(paginationDto, req.user?.id, req.user?.role);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get orders for logged-in owner' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findMyOrders(@Request() req) {
    return this.ordersService.findByOwner(req.user.id, req.user.role);
  }

  @Get('customer/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all bookings for the logged-in customer' })
  async findMyCustomerOrders(@Request() req) {
    // Customer JWTs put the customer id in req.user.id (set by JwtStrategy).
    return this.ordersService.findByCustomer(req.user.id);
  }

  @Get('customer/mine/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single booking belonging to the logged-in customer' })
  async findOneForCustomer(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.ordersService.findOneForCustomer(id, req.user.id);
  }

  @Get('export/csv')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export orders as CSV' })
  async exportCsv(@Request() req, @Query('filename') filename: string, @Res({ passthrough: true }) res: Response) {
    const csv = await this.ordersService.exportOrdersCsv(req.user?.id, req.user?.role);
    const safeFilename = filename || `orders-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    return csv;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.ordersService.findOne(id, req.user?.id, req.user?.role);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BAR, UserRole.DISTILLERY, UserRole.EVENT_HOST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderStatusDto,
    @Request() req
  ) {
    return this.ordersService.updateStatus(id, updateOrderDto, req.user.id, req.user.role);
  }
}

