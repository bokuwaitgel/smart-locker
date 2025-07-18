import { Injectable, ForbiddenException, NotFoundException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartDeliveryDto } from './dto/start-delivery.dto';
import { PickupRequestDto } from './dto/pickup-request.dto';
import { UnlockDto } from './dto/unlock.dto';
import { randomBytes } from 'crypto';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService, private smsService: SmsService) {}

  async getLockerStatus(containerNumber: string) {
    const container = await this.prisma.container.findUnique({
      where: { boardId: containerNumber },
      include: { Lockers: true },
    });
    if (!container) {
      throw new NotFoundException('Container not found');
    }

    return {
      success: true,
      type: 'success',
      message: 'Locker status retrieved successfully',
      statusCode: HttpStatus.OK,
      data: container.Lockers,
    };
  }

  async requestPickup(data: PickupRequestDto) {
    const delivery = await this.prisma.deliveryOrder.findUnique({
      where: { pickupCode: data.pickupCode },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery order not found');
    }
    //check payment status
    if (delivery.paymentStatus !== 'PAID') {
      return {
        success: false,
        type: 'error',
        message: 'Payment not completed',
        statusCode: HttpStatus.FORBIDDEN,
      };
    }

    if (delivery.status !== 'WAITING') {
      return {
        success: false,
        type: 'error',
        message: 'Delivery order is not in waiting status',
        statusCode: HttpStatus.FORBIDDEN,
      };
    }
    // Update delivery status to PICKED_UP
    const updatedDelivery = await this.prisma.deliveryOrder.update({
      where: { pickupCode: data.pickupCode },
      data: {
        status: 'PICKED_UP',
        pickedUpAt: new Date(),
      },
    });

    if (!updatedDelivery) {
      return {
        success: false,
        type: 'error',
        message: 'Failed to update delivery status',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    // Update locker status to AVAILABLE
    await this.prisma.locker.update({
      where: { id: updatedDelivery.lockerId },
      data: { status: 'AVAILABLE' },
    });

    // Send SMS notification
    if (updatedDelivery.deliveryMobile) {
      await this.smsService.sendSMS(
        updatedDelivery.deliveryMobile,
        `Таны илгээмжийг амжилттай хүлээн авлаа! Код: ${data.pickupCode}`
      );
    }

    return {
      success: true,
      message: 'Pickup request successful',
      data: delivery,
    };
  }

  async startDelivery(data: StartDeliveryDto) {
    const locker = await this.prisma.locker.findUnique({
      where: { id: data.lockerId },
    });

    if (!locker || locker.status !== 'AVAILABLE') {
      return {
        success: false,
        type: 'error',
        message: 'Locker not available or does not exist',
        statusCode: HttpStatus.NOT_FOUND,
      }
    }

    const code = randomBytes(6).toString('hex').toUpperCase();
    const delivery = await this.prisma.deliveryOrder.create({
      data: {
        lockerId: data.lockerId,
        containerNumber: data.containerNumber,
        pickupCode: code,
        deliveryMobile: data.deliveryMobile,
        pickupMobile: data.pickupMobile,
        status: 'WAITING',
        paymentStatus: 'UNPAID',
        deliveredAt: new Date(),
      },
    });
    if (!delivery) {
      return {
        success: false,
        type: 'error',
        message: 'Failed to start delivery',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    // Update locker status to PENDING
    await this.prisma.locker.update({
      where: { id: data.lockerId },
      data: { status: 'PENDING' },
    });

    const container = await this.prisma.container.findUnique({
      where: { boardId: data.containerNumber },
    });

    // Send SMS notification
    await this.smsService.sendPickupCode(data.pickupMobile, container?.location ? container.location : '', code);
    await this.smsService.sendDeliveryCode(data.deliveryMobile, code);


    return {
      success: true,
      message: 'Delivery started successfully',
      data: delivery,
    };
  }

  
}
