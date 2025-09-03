import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SmsDto {
  @ApiProperty({
    description: 'Phone number to send SMS to',
    example: '+97699119911',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'SMS message content',
    example: 'Your verification code is: 123456',
  })
  @IsNotEmpty({ message: 'Message is required' })
  @IsString()
  @MinLength(1, { message: 'Message cannot be empty' })
  @MaxLength(160, { message: 'Message cannot exceed 160 characters' })
  message: string;
}

export class PickupCodeDto {
  @ApiProperty({
    description: 'Phone number to send pickup code to',
    example: '+97699119911',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Locker location',
    example: 'Central Station, Locker #5',
  })
  @IsNotEmpty({ message: 'Locker location is required' })
  @IsString()
  @MaxLength(100, { message: 'Location cannot exceed 100 characters' })
  lockerLocation: string;

  @ApiProperty({
    description: 'Pickup code',
    example: 'A1B2C3',
  })
  @IsNotEmpty({ message: 'Pickup code is required' })
  @IsString()
  @MinLength(4, { message: 'Pickup code must be at least 4 characters' })
  @MaxLength(10, { message: 'Pickup code cannot exceed 10 characters' })
  code: string;

  @ApiProperty({
    description: 'Delivery order ID',
    example: 123,
    required: false,
  })
  deliveryId?: number;
}

export class DeliveryCodeDto {
  @ApiProperty({
    description: 'Phone number to send delivery code to',
    example: '+97699119911',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Delivery code',
    example: 'D4E5F6',
  })
  @IsNotEmpty({ message: 'Delivery code is required' })
  @IsString()
  @MinLength(4, { message: 'Delivery code must be at least 4 characters' })
  @MaxLength(10, { message: 'Delivery code cannot exceed 10 characters' })
  code: string;
}
