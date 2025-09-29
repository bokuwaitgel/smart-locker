import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SmsModule } from '../sms/sms.module';
import { DeliveryModule } from 'src/delivery/delivery.module';
import { LockerModule } from 'src/locker/locker.module';

@Module({
  imports: [PrismaModule, AuthModule, HttpModule, forwardRef(() => SmsModule), forwardRef(() => DeliveryModule), forwardRef(() => LockerModule)],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
