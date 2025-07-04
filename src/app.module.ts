import { Module } from '@nestjs/common';
import { LockerModule } from './locker/locker.module';
import { DeliveryModule } from './delivery/delivery.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [LockerModule, DeliveryModule, PaymentModule, PrismaModule],
})
export class AppModule {}
