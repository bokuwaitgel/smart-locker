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
