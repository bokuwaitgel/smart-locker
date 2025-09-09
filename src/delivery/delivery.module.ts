import { Module, forwardRef } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SmsModule } from '../sms/sms.module';
import { PaymentModule } from '../payment/payment.module';
import { DeliveryGateway } from './delivery.gateway';
import { PaymentService } from 'src/payment/payment.service';
import { PrismaService } from 'src/prisma/prisma.service';


@Module({
  imports: [PrismaModule, SmsModule, forwardRef(() => PaymentModule)],
  controllers: [DeliveryController],
  providers: [DeliveryService, DeliveryGateway],
  exports: [DeliveryService, DeliveryGateway],
})
export class DeliveryModule {}
