import { ApiProperty } from '@nestjs/swagger';

export class UnlockDto {
  @ApiProperty({ example: 1 })
  orderId: number;
}
