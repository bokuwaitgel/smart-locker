import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { SmsService } from 'src/sms/sms.service';
import { PaymentController } from './payment.controller';
import { SmsController } from 'src/sms/sms.controller';

@Module({
  controllers: [PaymentController, SmsController],
  providers: [PaymentService, SmsService],
})
export class PaymentModule {}
