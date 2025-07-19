import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { LockerService } from './locker.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { CreateLockerDto, UpdateLockerDto } from './dto';
@ApiTags('locker')
@Controller('lockers')
export class LockerController {
  constructor(private readonly lockerService: LockerService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get locker status by lockerNumber (or all if blank)' })
  getStatus(@Query('lockerNumber') lockerNumber?: string) {
    return this.lockerService.getStatus(lockerNumber);
  }


  @Post('create')
  @ApiOperation({ summary: 'Create a new locker' })
  async createLocker(@Body() data: CreateLockerDto) {
    return this.lockerService.createLocker(data);
  }

  @Put('update/:id')
  @ApiOperation({ summary: 'Update a locker' })
  async updateLocker(@Param('id') id: string, @Body() data: UpdateLockerDto) {
    return this.lockerService.updateLocker(Number(id), data);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Delete a locker' })
  async deleteLocker(@Param('id') id: string) {
    return this.lockerService.deleteLocker(Number(id));
  }

}
