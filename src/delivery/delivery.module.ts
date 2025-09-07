import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SmsModule } from '../sms/sms.module';
import { PaymentModule } from '../payment/payment.module';
import { DeliveryGateway } from './delivery.gateway';


@Module({
  imports: [PrismaModule, SmsModule, PaymentModule],
  controllers: [DeliveryController],
  providers: [DeliveryService, DeliveryGateway],
  exports: [DeliveryService],
})
export class DeliveryModule {}
