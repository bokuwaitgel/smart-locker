import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { StartDeliveryDto } from './dto/start-delivery.dto';
import { PickupRequestDto } from './dto/pickup-request.dto';
import { UnlockDto } from './dto/unlock.dto';


@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('locker-status/:boardId')
  @ApiOperation({ summary: 'Get locker status by board ID' })
  @ApiResponse({ status: 200, description: 'Locker status retrieved successfully' })
  async getLockerStatus(@Param('boardId') boardId: string) {
    return this.deliveryService.getLockerStatus(boardId);
  }

  @Post('start')
  @ApiOperation({ summary: 'Start a new delivery' })
  @ApiResponse({ status: 201, description: 'Delivery started successfully' })
  async startDelivery(@Body() data: StartDeliveryDto) {
    return this.deliveryService.startDelivery(data);
  }

  @Post('pickup-request')
  @ApiOperation({ summary: 'Request pickup for a delivery' })
  @ApiResponse({ status: 200, description: 'Pickup request processed successfully' })
  async requestPickup(@Body() data: PickupRequestDto) {
    return this.deliveryService.requestPickup(data);
  }

  @Get('history/:boardId')
  @ApiOperation({ summary: 'Get delivery history by ID' })
  @ApiResponse({ status: 200, description: 'Delivery history retrieved successfully' })
  async getDeliveryHistory(@Param('boardId') boardId: string) {
    return this.deliveryService.getDeliveryHistory(boardId);
  }

}
