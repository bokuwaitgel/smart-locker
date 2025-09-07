import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  MinLength,
} from 'class-validator';
import { LockerStatus } from '@prisma/client';

export class CreateLockerDto {
  @ApiProperty({
    description: 'Board ID of the container where this locker belongs',
    example: 'BOARD_001',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  boardId: string;

  @ApiProperty({
    description: 'Unique locker number within the container',
    example: 'L001',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  lockerNumber: string;

  @ApiPropertyOptional({
    description: 'Optional description of the locker',
    example: 'Small locker for packages',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Index position of the locker in the container',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  lockerIndex: number;
}

export class UpdateLockerDto {
  @ApiPropertyOptional({
    description: 'Optional description of the locker',
    example: 'Medium locker for packages',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status of the locker',
    enum: LockerStatus,
    example: LockerStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(LockerStatus)
  status?: LockerStatus;
}

export class LockerResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  lockerNumber: string;

  @ApiProperty()
  status: LockerStatus;

  @ApiProperty()
  boardId: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  container?: any;
}

export class LockerStatsDto {
  @ApiProperty()
  totalLockers: number;

  @ApiProperty()
  availableLockers: number;

  @ApiProperty()
  occupiedLockers: number;

  @ApiProperty()
  pendingLockers: number;

  @ApiProperty()
  maintenanceLockers: number;
}

export class BulkUpdateLockersDto {
  @ApiProperty({
    description: 'Array of locker IDs to update',
    example: [1, 2, 3],
  })
  @IsNotEmpty()
  lockerIds: number[];

  @ApiProperty({
    description: 'New status for all selected lockers',
    enum: LockerStatus,
    example: LockerStatus.AVAILABLE,
  })
  @IsNotEmpty()
  @IsEnum(LockerStatus)
  status: LockerStatus;
}
