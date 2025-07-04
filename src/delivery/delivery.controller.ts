import { Controller, Post, Body } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { StartDeliveryDto } from './dto/start-delivery.dto';
import { PickupRequestDto } from './dto/pickup-request.dto';
import { UnlockDto } from './dto/unlock.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a delivery order (drop-off)' })
  @ApiResponse({ status: 201, description: 'Locker assigned and pickup code generated.' })
  startDelivery(@Body() dto: StartDeliveryDto) {
    return this.deliveryService.startDelivery(dto);
  }

  @Post('pickup-request')
  @ApiOperation({ summary: 'Request to pickup a delivery (enter code)' })
  pickupRequest(@Body() dto: PickupRequestDto) {
    return this.deliveryService.pickupRequest(dto);
  }

  @Post('unlock')
  @ApiOperation({ summary: 'Unlock after payment' })
  unlock(@Body() dto: UnlockDto) {
    return this.deliveryService.unlockLocker(dto);
  }
}
