import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class StartDeliveryDto {
  @ApiProperty()
  @IsNotEmpty()
  lockerId: number;

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
