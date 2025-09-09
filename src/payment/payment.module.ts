import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SmsService } from '../sms/sms.service';
import { DeliveryGateway } from 'src/delivery/delivery.gateway';
import { DeliveryModule } from 'src/delivery/delivery.module';

@Module({
  imports: [PrismaModule, AuthModule, HttpModule, forwardRef(() => DeliveryModule)],
  controllers: [PaymentController],
  providers: [PaymentService, SmsService],
  exports: [PaymentService],
})
export class PaymentModule {}
