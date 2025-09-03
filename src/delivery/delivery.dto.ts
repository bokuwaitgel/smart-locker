import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsPhoneNumber, IsOptional, IsNumber, Min, Max, IsEnum, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export enum DeliveryStatus {
  WAITING = 'WAITING',
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  PICKED_UP = 'PICKED_UP',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  FAILED = 'FAILED'
}

export class StartDeliveryDto {
  @ApiProperty({
    description: 'Locker ID where the delivery will be placed',
    example: 'L001'
  })
  @IsNotEmpty({ message: 'Locker ID is required' })
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  lockerId: string;

  @ApiProperty({
    description: 'Board ID of the container',
    example: 'BOARD_001'
  })
  @IsNotEmpty({ message: 'Board ID is required' })
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  boardId: string;

  @ApiProperty({
    description: 'Mobile number of the delivery person',
    example: '+97699119911'
  })
  @IsNotEmpty({ message: 'Delivery mobile number is required' })
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  @IsPhoneNumber('MN', { message: 'Invalid Mongolian phone number format' })
  deliveryMobile: string;

  @ApiProperty({
    description: 'Mobile number of the person who will pick up the delivery',
    example: '+97688118811'
  })
  @IsNotEmpty({ message: 'Pickup mobile number is required' })
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  @IsPhoneNumber('MN', { message: 'Invalid Mongolian phone number format' })
  pickupMobile: string;

  @ApiPropertyOptional({
    description: 'Delivery description or notes',
    example: 'Electronics package'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  description?: string;

  @ApiPropertyOptional({
    description: 'Estimated delivery time in hours',
    example: 2
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Estimated time must be at least 1 hour' })
  @Max(72, { message: 'Estimated time cannot exceed 72 hours' })
  estimatedHours?: number;
}

export class PickupRequestDto {
  @ApiProperty({
    description: 'Pickup code for the delivery',
    example: 'ABCD1234'
  })
  @IsNotEmpty({ message: 'Pickup code is required' })
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  pickupCode: string;
}

export class CancelDeliveryDto {
  @ApiProperty({
    description: 'Pickup code for the delivery to cancel',
    example: 'ABCD1234'
  })
  @IsNotEmpty({ message: 'Pickup code is required' })
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  pickupCode: string;

  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Customer requested cancellation'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  reason?: string;
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({
    description: 'Pickup code for the delivery',
    example: 'ABCD1234'
  })
  @IsNotEmpty({ message: 'Pickup code is required' })
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  pickupCode: string;

  @ApiProperty({
    description: 'New status for the delivery',
    enum: DeliveryStatus,
    example: DeliveryStatus.DELIVERED
  })
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(DeliveryStatus, { message: 'Invalid delivery status' })
  status: DeliveryStatus;
}

export class DeliveryHistoryDto {
  @ApiPropertyOptional({
    description: 'Filter by board ID',
    example: 'BOARD_001'
  })
  @IsOptional()
  @IsString()
  boardId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: DeliveryStatus,
    example: DeliveryStatus.PICKED_UP
  })
  @IsOptional()
  @IsEnum(DeliveryStatus, { message: 'Invalid delivery status' })
  status?: DeliveryStatus;

  @ApiPropertyOptional({
    description: 'Filter by pickup mobile',
    example: '+97699119911'
  })
  @IsOptional()
  @IsString()
  pickupMobile?: string;

  @ApiPropertyOptional({
    description: 'Limit number of results',
    example: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Skip number of results',
    example: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Skip cannot be negative' })
  skip?: number = 0;
}
