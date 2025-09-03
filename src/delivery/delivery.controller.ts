import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import {
  StartDeliveryDto,
  PickupRequestDto,
  InitBoardDto,
} from './delivery.dto';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('init-board')
  @ApiOperation({ summary: 'Initialize lockers for a board' })
  @ApiResponse({
    status: 201,
    description: 'Lockers initialized successfully',
  })
  async initBoard(@Body() data: InitBoardDto) {
    return this.deliveryService.initBoardLockers(data);
  }

  @Get('locker-status/:boardId')
  @ApiOperation({ summary: 'Get locker status by board ID' })
  @ApiResponse({
    status: 200,
    description: 'Locker status retrieved successfully',
  })
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
  @ApiResponse({
    status: 200,
    description: 'Pickup request processed successfully',
  })
  async requestPickup(@Body() data: PickupRequestDto) {
    return this.deliveryService.requestPickup(data);
  }

  @Post('check-payment')
  @ApiOperation({ summary: 'Check payment status for a delivery' })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved successfully',
  })
  async checkPayment(@Body() data: PickupRequestDto) {
    return this.deliveryService.checkPayment(data);
  }
}
