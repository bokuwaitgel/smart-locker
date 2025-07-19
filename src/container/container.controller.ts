import { Controller, Post, Body, Get, Param, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ContainerService } from './container.service';

import { CreateContainerDto, UpdateContainerDto } from './dto';

@ApiTags('container')
@Controller('container')
export class ContainerController {
  constructor(private readonly containerService: ContainerService) {}

    @Post('create')
    @ApiOperation({ summary: 'Create a new container' })
    @ApiResponse({ status: 201, description: 'Container created successfully' })
    async createContainer(@Body() data: CreateContainerDto) {
        console.log('Creating container with data:', data);
        return this.containerService.createContainer(data);
    }

    @Get('all')
    @ApiOperation({ summary: 'Get all containers' })
    @ApiResponse({ status: 200, description: 'Containers retrieved successfully' })
    async getAllContainers() {
        return this.containerService.getAllContainers();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get container by ID' })
    @ApiResponse({ status: 200, description: 'Container retrieved successfully' })
    async getContainerById(@Param('id') id: number) {
        return this.containerService.getContainerById(id);
    }

    @Put('update/:id')
    @ApiOperation({ summary: 'Update a container' })
    @ApiResponse({ status: 200, description: 'Container updated successfully' })
    async updateContainer(@Param('id') id: number, @Body() data: UpdateContainerDto) {
        return this.containerService.updateContainer(id, data);
    }

    @Post('delete/:id')
    @ApiOperation({ summary: 'Delete a container' })
    @ApiResponse({ status: 200, description: 'Container deleted successfully' })
    async deleteContainer(@Body('id') id: number) {
        return this.containerService.deleteContainer(id);
    }

    @Get('lockers/:boardId')
    @ApiOperation({ summary: 'Get all lockers in a container' })
    @ApiResponse({ status: 200, description: 'Lockers retrieved successfully' })
    async getLockersInContainer(@Param('boardId') boardId: string) {
        return this.containerService.getAllLockersInContainer(boardId);
    }
}