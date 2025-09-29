import { Module, forwardRef } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SmsModule } from '../sms/sms.module';
import { PaymentModule } from '../payment/payment.module';
import { DeliveryGateway } from './delivery.gateway';
import { LockerModule } from 'src/locker/locker.module';

@Module({
  imports: [PrismaModule, forwardRef(() => SmsModule), forwardRef(() => PaymentModule), forwardRef(() => LockerModule)],
  controllers: [DeliveryController],
  providers: [DeliveryService, DeliveryGateway],
  exports: [DeliveryService, DeliveryGateway],
})
export class DeliveryModule {}
