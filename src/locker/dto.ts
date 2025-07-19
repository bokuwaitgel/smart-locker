import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateLockerDto {
    @ApiProperty()
    @IsNotEmpty()
    boardId: string;

    @ApiProperty()
    @IsNotEmpty()
    lockerNumber: string;

    @ApiProperty({ required: false })
    description?: string;
}

export class UpdateLockerDto {
    @ApiProperty({ required: false })
    description?: string;
    @ApiProperty()
    @IsNotEmpty()
    status: string;
}