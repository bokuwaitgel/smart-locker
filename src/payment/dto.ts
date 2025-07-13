
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty()
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  deliveryId: number;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsNotEmpty()
  deliveryId: number;

  @ApiProperty()
  @IsNotEmpty()
  amount: number;
}

export class CheckInvoiceDto {
  @ApiProperty()
  @IsNotEmpty()
  paymentId: number;

  @ApiProperty()
  @IsNotEmpty()
  deliveryId: number;
}