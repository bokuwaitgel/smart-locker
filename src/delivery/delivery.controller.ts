import { Controller, Post, Body, Get, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { StartDeliveryDto, PickupRequestDto, CancelDeliveryDto, UpdateDeliveryStatusDto, DeliveryHistoryDto } from './delivery.dto';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('locker-status/:boardId')
  @ApiOperation({ summary: 'Get locker status by board ID' })
  @ApiResponse({ status: 200, description: 'Locker status retrieved successfully' })
  @ApiParam({ name: 'boardId', description: 'Board ID of the container' })
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

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel a delivery' })
  @ApiResponse({ status: 200, description: 'Delivery cancelled successfully' })
  async cancelDelivery(@Body() data: CancelDeliveryDto) {
    return this.deliveryService.cancelDelivery(data);
  }

  @Put('status')
  @ApiOperation({ summary: 'Update delivery status' })
  @ApiResponse({ status: 200, description: 'Delivery status updated successfully' })
  async updateDeliveryStatus(@Body() data: UpdateDeliveryStatusDto) {
    return this.deliveryService.updateDeliveryStatus(data);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get delivery history with filters' })
  @ApiResponse({ status: 200, description: 'Delivery history retrieved successfully' })
  @ApiQuery({ name: 'boardId', required: false, description: 'Filter by board ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by delivery status' })
  @ApiQuery({ name: 'pickupMobile', required: false, description: 'Filter by pickup mobile' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results', type: Number })
  @ApiQuery({ name: 'skip', required: false, description: 'Skip number of results', type: Number })
  async getDeliveryHistory(@Query() filters: DeliveryHistoryDto) {
    return this.deliveryService.getDeliveryHistory(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get delivery statistics' })
  @ApiResponse({ status: 200, description: 'Delivery statistics retrieved successfully' })
  async getDeliveryStats() {
    return this.deliveryService.getDeliveryStats();
  }

  @Get(':pickupCode')
  @ApiOperation({ summary: 'Get delivery by pickup code' })
  @ApiResponse({ status: 200, description: 'Delivery retrieved successfully' })
  @ApiParam({ name: 'pickupCode', description: 'Pickup code of the delivery' })
  async getDeliveryByCode(@Param('pickupCode') pickupCode: string) {
    return this.deliveryService.getDeliveryByCode(pickupCode);
  }

  @Post('check-payment')
  @ApiOperation({ summary: 'Check payment status for a delivery' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  async checkPayment(@Body() data: PickupRequestDto) {
    return this.deliveryService.checkPayment(data);
  }
}
