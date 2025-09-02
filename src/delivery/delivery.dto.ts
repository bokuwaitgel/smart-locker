import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class StartDeliveryDto {
  @ApiProperty()
  @IsNotEmpty()
  lockerId: string;

  @ApiProperty()
  @IsNotEmpty()
  boardId: string;

  @ApiProperty()
  @IsNotEmpty()
  deliveryMobile: string;

  @ApiProperty()
  @IsNotEmpty() 
  pickupMobile: string;

}

export class PickupRequestDto {
  @ApiProperty({ example: 'ABCD1234' })
  pickupCode: string;
}
