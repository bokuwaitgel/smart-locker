import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { SmsService } from 'src/sms/sms.service';
import { DeliveryController } from './delivery.controller';
import { SmsController } from 'src/sms/sms.controller';
import { PaymentService } from 'src/payment/payment.service';

@Module({
  controllers: [DeliveryController, SmsController],
  providers: [DeliveryService, SmsService, PaymentService],
})
export class DeliveryModule {}
