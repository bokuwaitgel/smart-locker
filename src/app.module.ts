import { Module } from '@nestjs/common';
import { LockerModule } from './locker/locker.module';
import { DeliveryModule } from './delivery/delivery.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ContainerModule } from './container/container.module';
import { SmsService } from './sms/sms.service';
import { SmsController } from './sms/sms.controller';
import { SmsModule } from './sms/sms.module';
import { DeliveryGateway } from './delivery/delivery.gateway';

@Module({
  imports: [
    LockerModule,
    DeliveryModule,
    PaymentModule,
    PrismaModule,
    AuthModule,
    ContainerModule,
    SmsModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
