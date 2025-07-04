import { ApiProperty } from '@nestjs/swagger';

export class PickupRequestDto {
  @ApiProperty({ example: 'ABCD1234' })
  pickupCode: string;
}
