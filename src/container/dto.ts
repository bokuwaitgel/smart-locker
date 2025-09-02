import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateContainerDto {
  @ApiProperty()
  @IsNotEmpty()
  boardId: string;

  @ApiProperty()
  @IsNotEmpty()
  location: string;

  @ApiProperty()
  description?: string;
}

export class UpdateContainerDto {
  @ApiProperty()
  @IsNotEmpty()
  baudRate: number;

  @ApiProperty()
  @IsNotEmpty()
  location: string;

  @ApiProperty()
  description?: string;
}
