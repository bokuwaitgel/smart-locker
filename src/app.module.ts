import { Module } from '@nestjs/common';
import { LockerModule } from './locker/locker.module';
import { DeliveryModule } from './delivery/delivery.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ContainerModule } from './container/container.module';
import { SmsModule } from './sms/sms.module';
import { BannerModule } from './banner/banner.module';

@Module({
  imports: [
    LockerModule,
    DeliveryModule,
    PaymentModule,
    PrismaModule,
    AuthModule,
    ContainerModule,
    SmsModule,
    BannerModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
