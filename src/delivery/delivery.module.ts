import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { SmsService } from 'src/sms/sms.service';
import { DeliveryController } from './delivery.controller';
import { SmsController } from 'src/sms/sms.controller';

@Module({
  controllers: [DeliveryController, SmsController],
  providers: [DeliveryService, SmsService],
})
export class DeliveryModule {}
