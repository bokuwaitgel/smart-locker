#!/bin/bash

# Scaffold NestJS project if not present
if [ ! -d "src" ]; then
  npx @nestjs/cli new smart-locker-backend --skip-git --package-manager npm --strict
  cd smart-locker-backend
else
  cd .
fi

# Install Prisma, Swagger dependencies
npm install prisma @prisma/client
npm install --save @nestjs/swagger swagger-ui-express

# Add scripts to package.json (if not present)
npx npm-add-script -k "prisma:generate" -v "prisma generate"
npx npm-add-script -k "prisma:migrate" -v "prisma migrate dev"
npx npm-add-script -k "prisma:deploy" -v "prisma migrate deploy"
npx npm-add-script -k "prisma:studio" -v "prisma studio"

# Init Prisma
npx prisma init

# Overwrite prisma/schema.prisma
cat > prisma/schema.prisma <<'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Locker {
  id         Int             @id @default(autoincrement())
  number     Int             @unique
  status     LockerStatus
  deliveries DeliveryOrder[]
}

model DeliveryOrder {
  id            Int           @id @default(autoincrement())
  lockerId      Int
  locker        Locker        @relation(fields: [lockerId], references: [id])
  pickupCode    String        @unique
  recipient     String
  status        DeliveryStatus
  serviceCharge Int
  paymentStatus PaymentStatus
  deliveredAt   DateTime
  pickedUpAt    DateTime?
}

enum LockerStatus {
  AVAILABLE
  OCCUPIED
  MAINTENANCE
}

enum DeliveryStatus {
  WAITING
  DELIVERED
  PICKED_UP
  CANCELLED
}

enum PaymentStatus {
  UNPAID
  PAID
  FAILED
}
EOF

# .env template
cat > .env <<'EOF'
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
EOF

# Make src folders
mkdir -p src/prisma src/locker src/delivery/dto src/payment

# PrismaService
cat > src/prisma/prisma.service.ts <<'EOF'
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
EOF

# PrismaModule
cat > src/prisma/prisma.module.ts <<'EOF'
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
EOF

# LockerModule
cat > src/locker/locker.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { LockerService } from './locker.service';
import { LockerController } from './locker.controller';

@Module({
  controllers: [LockerController],
  providers: [LockerService],
  exports: [LockerService],
})
export class LockerModule {}
EOF

# LockerService
cat > src/locker/locker.service.ts <<'EOF'
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LockerService {
  constructor(private prisma: PrismaService) {}

  async getStatus(lockerId?: number) {
    if (lockerId) {
      return this.prisma.locker.findUnique({ where: { id: lockerId } });
    }
    return this.prisma.locker.findMany();
  }
}
EOF

# LockerController
cat > src/locker/locker.controller.ts <<'EOF'
import { Controller, Get, Query } from '@nestjs/common';
import { LockerService } from './locker.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('locker')
@Controller('lockers')
export class LockerController {
  constructor(private readonly lockerService: LockerService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get locker status by lockerId (or all if blank)' })
  getStatus(@Query('lockerId') lockerId?: number) {
    return this.lockerService.getStatus(lockerId);
  }
}
EOF

# DeliveryModule
cat > src/delivery/delivery.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';

@Module({
  controllers: [DeliveryController],
  providers: [DeliveryService],
})
export class DeliveryModule {}
EOF

# DeliveryService
cat > src/delivery/delivery.service.ts <<'EOF'
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartDeliveryDto } from './dto/start-delivery.dto';
import { PickupRequestDto } from './dto/pickup-request.dto';
import { UnlockDto } from './dto/unlock.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async startDelivery(dto: StartDeliveryDto) {
    const locker = await this.prisma.locker.findFirst({
      where: { status: 'AVAILABLE' },
    });
    if (!locker) throw new ForbiddenException('No available locker.');

    const code = randomBytes(4).toString('hex').toUpperCase();

    const order = await this.prisma.deliveryOrder.create({
      data: {
        lockerId: locker.id,
        pickupCode: code,
        recipient: dto.recipient,
        status: 'DELIVERED',
        serviceCharge: dto.serviceCharge,
        paymentStatus: 'UNPAID',
        deliveredAt: new Date(),
      },
    });

    await this.prisma.locker.update({
      where: { id: locker.id },
      data: { status: 'OCCUPIED' },
    });

    return {
      lockerId: locker.id,
      pickupCode: code,
      orderId: order.id,
    };
  }

  async pickupRequest(dto: PickupRequestDto) {
    const order = await this.prisma.deliveryOrder.findUnique({
      where: { pickupCode: dto.pickupCode },
    });
    if (!order) throw new NotFoundException('Invalid code.');
    if (order.status !== 'DELIVERED') throw new ForbiddenException('Not ready for pickup.');

    if (order.paymentStatus !== 'PAID') {
      return {
        paymentRequired: true,
        amount: order.serviceCharge,
        orderId: order.id,
        message: 'Payment required before pickup.',
      };
    }

    return {
      paymentRequired: false,
      orderId: order.id,
      lockerId: order.lockerId,
      message: 'Ready to unlock.',
    };
  }

  async unlockLocker(dto: UnlockDto) {
    const order = await this.prisma.deliveryOrder.findUnique({
      where: { id: dto.orderId },
    });
    if (!order || order.paymentStatus !== 'PAID') {
      throw new ForbiddenException('Payment required or invalid order.');
    }

    await this.prisma.deliveryOrder.update({
      where: { id: order.id },
      data: { status: 'PICKED_UP', pickedUpAt: new Date() },
    });
    await this.prisma.locker.update({
      where: { id: order.lockerId },
      data: { status: 'AVAILABLE' },
    });

    return { success: true, message: 'Locker unlocked.' };
  }
}
EOF

# DeliveryController
cat > src/delivery/delivery.controller.ts <<'EOF'
import { Controller, Post, Body } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { StartDeliveryDto } from './dto/start-delivery.dto';
import { PickupRequestDto } from './dto/pickup-request.dto';
import { UnlockDto } from './dto/unlock.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a delivery order (drop-off)' })
  @ApiResponse({ status: 201, description: 'Locker assigned and pickup code generated.' })
  startDelivery(@Body() dto: StartDeliveryDto) {
    return this.deliveryService.startDelivery(dto);
  }

  @Post('pickup-request')
  @ApiOperation({ summary: 'Request to pickup a delivery (enter code)' })
  pickupRequest(@Body() dto: PickupRequestDto) {
    return this.deliveryService.pickupRequest(dto);
  }

  @Post('unlock')
  @ApiOperation({ summary: 'Unlock after payment' })
  unlock(@Body() dto: UnlockDto) {
    return this.deliveryService.unlockLocker(dto);
  }
}
EOF

# Delivery DTOs
cat > src/delivery/dto/start-delivery.dto.ts <<'EOF'
import { ApiProperty } from '@nestjs/swagger';

export class StartDeliveryDto {
  @ApiProperty({ example: 'recipient@email.com' })
  recipient: string;

  @ApiProperty({ example: 100, description: 'Service charge in cents' })
  serviceCharge: number;
}
EOF

cat > src/delivery/dto/pickup-request.dto.ts <<'EOF'
import { ApiProperty } from '@nestjs/swagger';

export class PickupRequestDto {
  @ApiProperty({ example: 'ABCD1234' })
  pickupCode: string;
}
EOF

cat > src/delivery/dto/unlock.dto.ts <<'EOF'
import { ApiProperty } from '@nestjs/swagger';

export class UnlockDto {
  @ApiProperty({ example: 1 })
  orderId: number;
}
EOF

# PaymentModule (placeholder)
cat > src/payment/payment.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
EOF

cat > src/payment/payment.controller.ts <<'EOF'
import { Controller } from '@nestjs/common';

@Controller('payments')
export class PaymentController {}
EOF

cat > src/payment/payment.service.ts <<'EOF'
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {}
EOF

# App module and bootstrap
cat > src/app.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { LockerModule } from './locker/locker.module';
import { DeliveryModule } from './delivery/delivery.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [LockerModule, DeliveryModule, PaymentModule, PrismaModule],
})
export class AppModule {}
EOF

cat > src/main.ts <<'EOF'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Smart Locker API')
    .setDescription('Delivery and pickup API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
EOF

# Migrate and generate prisma
npx prisma migrate dev --name init
npx prisma generate

echo ""
echo "✅ Smart Locker backend with Prisma and Swagger is ready!"
echo "👉 Run: npm run start:dev"
echo "👉 Open: http://localhost:3000/api for Swagger docs"
