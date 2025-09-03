import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, MinLength } from 'class-validator';
import { ContainerStatus } from '@prisma/client';

export class CreateContainerDto {
  @ApiProperty({
    description: 'Unique board identifier for the container',
    example: 'BOARD_001'
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  boardId: string;

  @ApiProperty({
    description: 'Location of the container',
    example: 'Main Entrance'
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  location: string;

  @ApiPropertyOptional({
    description: 'Optional description of the container',
    example: 'Container near the main entrance with 20 lockers'
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateContainerDto {
  @ApiPropertyOptional({
    description: 'Location of the container',
    example: 'Main Entrance'
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  location?: string;

  @ApiPropertyOptional({
    description: 'Optional description of the container',
    example: 'Container near the main entrance with 20 lockers'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status of the container',
    enum: ContainerStatus,
    example: ContainerStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(ContainerStatus)
  status?: ContainerStatus;
}

export class ContainerResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  boardId: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  status: ContainerStatus;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  lockerCount?: number;
}

export class ContainerStatsDto {
  @ApiProperty()
  totalContainers: number;

  @ApiProperty()
  activeContainers: number;

  @ApiProperty()
  inactiveContainers: number;

  @ApiProperty()
  maintenanceContainers: number;

  @ApiProperty()
  totalLockers: number;
}
