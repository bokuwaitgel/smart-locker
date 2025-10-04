import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContainerService } from './container.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateContainerDto,
  UpdateContainerDto,
  ContainerStatsDto,
} from './dto';
import { ContainerStatus, UserRole } from '@prisma/client';

@ApiTags('containers')
@ApiBearerAuth()
@Controller('containers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContainerController {
  constructor(private readonly containerService: ContainerService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new container (Admin only)' })
  @ApiResponse({ status: 201, description: 'Container created successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async createContainer(@Body() data: CreateContainerDto, @Request() req) {
    return this.containerService.createContainer(data, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all containers' })
  @ApiResponse({
    status: 200,
    description: 'Containers retrieved successfully',
  })
  async getAllContainers(@Request() req) {
    return this.containerService.getAllContainers(req.user.role);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get container statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getContainerStats(): Promise<ContainerStatsDto> {
    return this.containerService.getContainerStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get container by ID' })
  @ApiResponse({ status: 200, description: 'Container retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Container not found' })
  async getContainerById(@Param('id', ParseIntPipe) id: number) {
    return this.containerService.getContainerById(id);
  }

  @Get('board/:boardId')
  @ApiOperation({ summary: 'Get container by board ID' })
  @ApiResponse({ status: 200, description: 'Container retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Container not found' })
  async getContainerByBoardId(@Param('boardId') boardId: string) {
    return this.containerService.getContainerByBoardId(boardId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a container (Admin only)' })
  @ApiResponse({ status: 200, description: 'Container updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Container not found' })
  async updateContainer(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateContainerDto,
    @Request() req,
  ) {
    return this.containerService.updateContainer(id, data, req.user.role);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update container status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Container status updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async updateContainerStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ContainerStatus,
    @Request() req,
  ) {
    return this.containerService.updateContainerStatus(
      id,
      status,
      req.user.role,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a container (Admin only)' })
  @ApiResponse({ status: 200, description: 'Container deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Container not found' })
  async deleteContainer(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.containerService.deleteContainer(id, req.user.role);
  }

  @Get(':boardId/lockers')
  @ApiOperation({ summary: 'Get all lockers in a container' })
  @ApiResponse({ status: 200, description: 'Lockers retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Container not found' })
  async getLockersInContainer(@Param('boardId') boardId: string) {
    return this.containerService.getAllLockersInContainer(boardId);
  }

  @Delete(':boardId/lockers')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all lockers in a container (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Lockers deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Container not found' })
  async deleteLockersInContainer(
    @Param('boardId') boardId: number,
    @Request() req,
  ) {
    return this.containerService.containerDeleteWithLockers(
       Number(boardId)
    );
  }
}
