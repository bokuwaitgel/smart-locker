import { ApiProperty } from '@nestjs/swagger';

export class StartDeliveryDto {
  @ApiProperty({ example: 'recipient@email.com' })
  recipient: string;

  @ApiProperty({ example: 100, description: 'Service charge in cents' })
  serviceCharge: number;
}
