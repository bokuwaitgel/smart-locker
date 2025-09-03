
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsPositive, Min, IsEnum, IsUUID } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Delivery order ID for which payment is being created',
    example: 123
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  deliveryId: number;

  @ApiProperty({
    description: 'Payment amount in Mongolian Tugrik',
    example: 5000,
    minimum: 100
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(100, { message: 'Minimum payment amount is 100 MNT' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Optional description for the payment',
    example: 'Payment for locker rental'
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Delivery order ID for invoice creation',
    example: 123
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  deliveryId: number;

  @ApiProperty({
    description: 'Invoice amount in Mongolian Tugrik',
    example: 5000,
    minimum: 100
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(100, { message: 'Minimum invoice amount is 100 MNT' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Optional invoice description',
    example: 'Invoice for smart locker service'
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CheckInvoiceDto {
  @ApiProperty({
    description: 'QPay invoice ID to check',
    example: 'invoice_123456789'
  })
  @IsNotEmpty()
  @IsString()
  invoiceId: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  status: PaymentStatus;

  @ApiProperty()
  deliveryId: number;

  @ApiPropertyOptional()
  InvoiceId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  delivery?: any;
}

export class PaymentStatsDto {
  @ApiProperty()
  totalPayments: number;

  @ApiProperty()
  paidPayments: number;

  @ApiProperty()
  unpaidPayments: number;

  @ApiProperty()
  failedPayments: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  paidAmount: number;
}

export class QPayTokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  expiresIn: number;

  @ApiProperty()
  refreshExpiresIn: number;
}

export class InvoiceResponseDto {
  @ApiProperty()
  invoice_id: string;

  @ApiProperty()
  invoice_url: string;

  @ApiProperty()
  qr_code: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  status: string;
}

export class PaymentHistoryDto {
  @ApiProperty()
  payment: PaymentResponseDto;

  @ApiPropertyOptional()
  delivery?: any;

  @ApiPropertyOptional()
  invoiceDetails?: InvoiceResponseDto;
}

export class RefundPaymentDto {
  @ApiProperty({
    description: 'Payment ID to refund',
    example: 123
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  paymentId: number;

  @ApiProperty({
    description: 'Refund amount (partial or full)',
    example: 2500
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Reason for refund',
    example: 'Customer requested cancellation'
  })
  @IsNotEmpty()
  @IsString()
  reason: string;
}