import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateContainerDto {
  @ApiProperty()
  @IsNotEmpty()
  number: string;

  @ApiProperty()
  @IsNotEmpty()
  location: string;

  @ApiProperty()
  description?: string;
}

export class UpdateContainerDto {
  @ApiProperty()
  @IsNotEmpty()
  number: string;

  @ApiProperty()
  @IsNotEmpty()
  location: string;

  @ApiProperty()
  description?: string;
}
