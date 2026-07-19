import { IsEnum, IsString, IsEmail, IsOptional, IsNumber, IsInt, IsDateString, IsBoolean, Min, Max } from 'class-validator';
import { OrderType } from '../entities/order.entity';

export class CreateOrderDto {
  @IsEnum(OrderType)
  orderType: OrderType;

  @IsString()
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsNumber()
  @IsOptional()
  barId?: number;

  @IsNumber()
  @IsOptional()
  distilleryId?: number;

  @IsNumber()
  @IsOptional()
  eventId?: number;

  @IsOptional()
  @IsInt()
  sessionId?: number;

  @IsDateString()
  @IsOptional()
  bookingDate?: string;

  @IsString()
  @IsOptional()
  bookingTime?: string;

  @IsNumber()
  @Min(1)
  @Max(100000)
  numberOfGuests: number;

  // Bounded on both ends: a negative amount would drive customer.totalSpent
  // backwards, and an absurd one overflows the numeric(10,2) column (a 500).
  @IsNumber()
  @Min(0)
  @Max(1000000)
  totalAmount: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsString()
  @IsOptional()
  specialRequests?: string;
}

