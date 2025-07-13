import { Controller, Post } from '@nestjs/common';
import { SmsService } from './sms.service';
import { ApiTags } from '@nestjs/swagger';


@Controller('sms')
export class SmsController {
    constructor(private readonly smsService: SmsService) {}
    
    @ApiTags('SMS')
    @Post('send')
    async sendSMS(phone: string, message: string) {
        return this.smsService.sendSMS(phone, message);
    }
}
