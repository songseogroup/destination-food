import { IsEnum, IsString, IsEmail, IsOptional, IsNumber, IsDateString, IsBoolean, Min } from 'class-validator';
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

  @IsDateString()
  @IsOptional()
  bookingDate?: string;

  @IsString()
  @IsOptional()
  bookingTime?: string;

  @IsNumber()
  @Min(1)
  numberOfGuests: number;

  @IsNumber()
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

