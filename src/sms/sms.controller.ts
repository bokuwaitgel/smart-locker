import { Body, Controller, Post } from '@nestjs/common';
import { SmsService } from './sms.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { SmsDto } from './sms.dto';

@Controller('sms')
export class SmsController {
    constructor(private readonly smsService: SmsService) {}
    
    @ApiTags('SMS')
    @Post('send')
    @ApiOperation({ summary: 'Send an SMS' })
    @ApiResponse({ status: 200, description: 'SMS sent successfully' })
    async sendSMS(@Body() data: SmsDto)  {
        return this.smsService.sendSMS(data.phone, data.message);
    }
}
