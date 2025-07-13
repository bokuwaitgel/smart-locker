import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateLockerDto {
    @ApiProperty()
    @IsNotEmpty()
    containerId: string;

    @ApiProperty()
    @IsNotEmpty()
    lockerNumber: string;

    @ApiProperty({ required: false })
    description?: string;
}

export class UpdateLockerDto {
    @ApiProperty({ required: false })
    description?: string;
}