import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AwsS3Service} from 'src/s3.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [BannerService, AwsS3Service],
  controllers: [BannerController]
})
export class BannerModule {}
