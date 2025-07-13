import { Controller, Post, Body, Get } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { StartDeliveryDto } from './dto/start-delivery.dto';
import { PickupRequestDto } from './dto/pickup-request.dto';
import { UnlockDto } from './dto/unlock.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('locker-status')
  @ApiOperation({ summary: 'Get locker status by container number' })
  @ApiResponse({ status: 200, description: 'Locker status retrieved successfully' })
  async getLockerStatus(@Body('containerNumber') containerNumber: string) {
    return this.deliveryService.getLockerStatus(containerNumber);
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
  

  
}
