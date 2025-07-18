import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SerialService } from './serial.service';

@ApiTags('serial')
@Controller('serial')
export class SerialController {
  constructor(private readonly serialService: SerialService) {}

  @Post('open-connection')
  openConn(@Body() body: { path?: string; baudRate?: number }) {
    return this.serialService.openConnection(body.path, body.baudRate);
  }

  @Post('close-connection')
  closeConn() {
    return this.serialService.closeConnection();
  }

  @Get('status')
  isOpen() {
    return { connected: this.serialService.isOpen() };
  }

  @Post('open-locker')
  openLocker(@Body() body: { boardId: number; doorId: number }) {
    return this.serialService.openLocker(body.boardId, body.doorId);
  }

  @Get('get-status')
  getStatus(@Query('boardId') boardId: number) {
    return this.serialService.getAllStatus(Number(boardId));
  }
}
