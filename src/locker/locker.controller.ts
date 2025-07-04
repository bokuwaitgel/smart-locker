import { Controller, Get, Query } from '@nestjs/common';
import { LockerService } from './locker.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('locker')
@Controller('lockers')
export class LockerController {
  constructor(private readonly lockerService: LockerService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get locker status by lockerId (or all if blank)' })
  getStatus(@Query('lockerId') lockerId?: number) {
    return this.lockerService.getStatus(lockerId);
  }
}
