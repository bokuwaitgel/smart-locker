import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { LockerService } from './locker.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateLockerDto,
  UpdateLockerDto,
  LockerStatsDto,
  BulkUpdateLockersDto,
} from './dto';
import { LockerStatus, UserRole } from '@prisma/client';

@ApiTags('lockers')
@ApiBearerAuth()
@Controller('lockers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LockerController {
  constructor(private readonly lockerService: LockerService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new locker (Admin only)' })
  @ApiResponse({ status: 201, description: 'Locker created successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Container not found' })
  async createLocker(@Body() data: CreateLockerDto, @Request() req) {
    return this.lockerService.createLocker(data, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all lockers' })
  @ApiResponse({ status: 200, description: 'Lockers retrieved successfully' })
  async getAllLockers(@Request() req) {
    return this.lockerService.getAllLockers(req.user.role);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get locker statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getLockerStats(): Promise<LockerStatsDto> {
    return this.lockerService.getLockerStats();
  }

  @Get('available')
  @ApiOperation({ summary: 'Get all available lockers' })
  @ApiQuery({
    name: 'boardId',
    required: false,
    description: 'Filter by container board ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Available lockers retrieved successfully',
  })
  async getAvailableLockers(@Query('boardId') boardId?: string) {
    return this.lockerService.getAvailableLockers(boardId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get locker by ID' })
  @ApiResponse({ status: 200, description: 'Locker retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Locker not found' })
  async getLockerById(@Param('id', ParseIntPipe) id: number) {
    return this.lockerService.getLockerById(id);
  }

  @Get('number/:lockerNumber')
  @ApiOperation({ summary: 'Get locker by locker number' })
  @ApiQuery({
    name: 'boardId',
    required: false,
    description: 'Container board ID for more specific search',
  })
  @ApiResponse({ status: 200, description: 'Locker retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Locker not found' })
  async getLockerByNumber(
    @Param('lockerNumber') lockerNumber: string,
    @Query('boardId') boardId?: string,
  ) {
    return this.lockerService.getLockerByNumber(lockerNumber, boardId);
  }

  @Get('status/:lockerNumber')
  @ApiOperation({ summary: 'Get locker status by locker number' })
  @ApiQuery({
    name: 'boardId',
    required: false,
    description: 'Container board ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Locker status retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Locker not found' })
  async getLockerStatus(
    @Param('lockerNumber') lockerNumber: string,
    @Query('boardId') boardId?: string,
  ) {
    return this.lockerService.getLockerStatus(lockerNumber, boardId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a locker (Admin only)' })
  @ApiResponse({ status: 200, description: 'Locker updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Locker not found' })
  async updateLocker(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateLockerDto,
    @Request() req,
  ) {
    return this.lockerService.updateLocker(id, data, req.user.role);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update locker status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Locker status updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async updateLockerStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: LockerStatus,
    @Request() req,
  ) {
    return this.lockerService.updateLockerStatus(id, status, req.user.role);
  }

  @Put('bulk/status_bulk')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk update locker statuses (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lockers updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async bulkUpdateLockers(@Body() data: BulkUpdateLockersDto, @Request() req) {
    return this.lockerService.bulkUpdateLockers(data, req.user.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a locker (Admin only)' })
  @ApiResponse({ status: 200, description: 'Locker deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Locker not found' })
  async deleteLocker(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.lockerService.deleteLocker(id, req.user.role);
  }

  @Get('container/:boardId')
  @ApiOperation({ summary: 'Get all lockers in a container' })
  @ApiResponse({ status: 200, description: 'Lockers retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Container not found' })
  async getLockersByContainer(@Param('boardId') boardId: string) {
    return this.lockerService.getLockersByContainer(boardId);
  }

  @Post('open')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Open a locker' })
  @ApiResponse({ status: 200, description: 'Locker opened successfully' })
  @ApiResponse({ status: 404, description: 'Locker not found' })
  async openLocker(@Body() data: { lockerNumber: string; boardId: string }) {
    return this.lockerService.openLocker(data.lockerNumber, data.boardId);
  }
}
