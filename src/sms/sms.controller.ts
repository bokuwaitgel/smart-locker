import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { SmsService } from './sms.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SmsDto, PickupCodeDto, DeliveryCodeDto } from './sms.dto';

@Controller('sms')
export class SmsController {
    constructor(private readonly smsService: SmsService) {}

    @ApiTags('SMS')
    @Post('send')
    @ApiOperation({ summary: 'Send a general SMS' })
    @ApiResponse({ status: 200, description: 'SMS sent successfully' })
    async sendSMS(@Body() data: SmsDto) {
        return this.smsService.sendSMS(data.phone, data.message);
    }

    @ApiTags('SMS')
    @Post('pickup-code')
    @ApiOperation({ summary: 'Send pickup code SMS' })
    @ApiResponse({ status: 200, description: 'Pickup code SMS sent successfully' })
    async sendPickupCode(@Body() data: PickupCodeDto) {
        return this.smsService.sendPickupCode(data.phone, data.lockerLocation, data.code, data.deliveryId || 0);
    }

    @ApiTags('SMS')
    @Post('delivery-code')
    @ApiOperation({ summary: 'Send delivery code SMS' })
    @ApiResponse({ status: 200, description: 'Delivery code SMS sent successfully' })
    async sendDeliveryCode(@Body() data: DeliveryCodeDto) {
        return this.smsService.sendDeliveryCode(data.phone, data.code);
    }

    @ApiTags('SMS')
    @Post('delivery-notification')
    @ApiOperation({ summary: 'Send delivery notification SMS' })
    @ApiResponse({ status: 200, description: 'Delivery notification SMS sent successfully' })
    async sendDeliveryNotification(@Body() data: SmsDto) {
        return this.smsService.sendDeliveryNotification(data.phone, data.message);
    }

    @ApiTags('SMS')
    @Get('history')
    @ApiOperation({ summary: 'Get SMS history for a phone number' })
    @ApiResponse({ status: 200, description: 'SMS history retrieved successfully' })
    async getSmsHistory(
        @Query('phone') phone: string,
        @Query('limit') limit?: string
    ) {
        const limitNum = limit ? parseInt(limit) : 10;
        return this.smsService.getSmsHistory(phone, limitNum);
    }

    @ApiTags('SMS')
    @Get('stats')
    @ApiOperation({ summary: 'Get SMS statistics' })
    @ApiResponse({ status: 200, description: 'SMS statistics retrieved successfully' })
    async getSmsStats() {
        return this.smsService.getSmsStats();
    }
}
