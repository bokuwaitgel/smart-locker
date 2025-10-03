import { Module, forwardRef } from '@nestjs/common';
import { LockerService } from './locker.service';
import { LockerController } from './locker.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from 'src/payment/payment.module';
import { DeliveryGateway } from 'src/delivery/delivery.gateway';

@Module({
  imports: [PrismaModule, AuthModule, forwardRef(() => PaymentModule)],
  controllers: [LockerController],
  providers: [LockerService, DeliveryGateway ],
  exports: [LockerService],
})
export class LockerModule {}
