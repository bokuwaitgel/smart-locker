import { Module, forwardRef } from '@nestjs/common';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DeliveryModule } from 'src/delivery/delivery.module';
import { LockerModule } from 'src/locker/locker.module';

@Module({
  imports: [PrismaModule, forwardRef(() => DeliveryModule), forwardRef(() => LockerModule)],
  controllers: [SmsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
