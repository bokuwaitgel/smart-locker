import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LockerService } from './locker.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { CreateLockerDto } from './dto';
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

  @Post('update')
  @ApiOperation({ summary: 'Update a locker' })
  async updateLocker(@Body() data: CreateLockerDto) {
    return this.lockerService.updateLocker(Number(data.lockerNumber), data);
  }

  @Post('delete')
  @ApiOperation({ summary: 'Delete a locker' })
  async deleteLocker(@Body('lockerNumber') lockerNumber: string) {
    return this.lockerService.deleteLocker(Number(lockerNumber));
  } 

}
