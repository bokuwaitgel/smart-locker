import { Injectable, ForbiddenException, NotFoundException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartDeliveryDto, PickupRequestDto } from './delivery.dto';
import { randomBytes } from 'crypto';
import { SmsService } from '../sms/sms.service';
import { PaymentService } from 'src/payment/payment.service';
import { stat } from 'fs';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService, private smsService: SmsService, private paymentService: PaymentService) {}

  async getLockerStatus(boardId: string) {
    const container = await this.prisma.container.findUnique({
      where: { boardId: boardId },
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
      return {
        success: false,
        type: 'error',
        message: 'Delivery order not found check pickup code',
        statusCode: HttpStatus.NOT_FOUND,
      };
    }
    //check payment status
    // if (delivery.paymentStatus !== 'PAID') {
    //   return {
    //     success: false,
    //     type: 'error',
    //     message: 'Payment not completed',
    //     statusCode: HttpStatus.FORBIDDEN,
    //   };
    // }

    if (delivery.status !== 'WAITING') {
      return {
        success: false,
        type: 'error',
        message: 'Delivery order is not in waiting status',
        statusCode: HttpStatus.FORBIDDEN,
      };
    }

    // check payment
    if (delivery.paymentStatus !== 'PAID') {
      //find last payment
      const lastPayment = await this.prisma.payment.findFirst({
        where: { deliveryId: delivery.id },
        orderBy: { createdAt: 'desc' },
      });

      // here should be calculate price
      const amount = 100;

      try {
        const payment = await this.paymentService.createInvoice({
          amount,
          deliveryId: delivery.id,
        });

        if (!payment) {
          return {
            success: false,
            type: 'error',
            message: 'Failed to create payment',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          };
        }

        return payment

      } catch (error) {

        console.error(error);

        return {
          success: false,
          type: 'error',
          message: 'Failed to create payment',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
      }
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
      where: { id: Number(updatedDelivery.lockerId) },
      data: { status: 'AVAILABLE' },
    });

    return {
      success: true,
      message: 'Pickup request successful',
      data: delivery,
    };
  }

  async checkPayment(data: PickupRequestDto) {
    const delivery = await this.prisma.deliveryOrder.findUnique({
      where: { pickupCode: data.pickupCode },
    });

    if (!delivery) {
      return {
        success: false,
        type: 'error',
        message: 'Delivery order not found',
        statusCode: HttpStatus.NOT_FOUND,
      };
    }

    if (delivery.paymentStatus !== 'PAID') {
      return {
        success: false,
        type: 'error',
        message: 'Payment not completed',
        statusCode: HttpStatus.FORBIDDEN,
      };
    }

    return {
      success: true,
      message: 'Payment status retrieved successfully',
      data: delivery.paymentStatus,
      statusCode: HttpStatus.OK,
    };
  }


  async startDelivery(data: StartDeliveryDto) {
    const locker = await this.prisma.locker.findUnique({
      where: { id: Number(data.lockerId) },
    });

    if (!locker) {
      return {
        success: false,
        type: 'error',
        message: 'Locker not available',
        statusCode: HttpStatus.NOT_FOUND,
      }
    }

    if (locker.status !== 'AVAILABLE') {
      return {
        success: false,
        type: 'error',
        message: 'Locker not available',
        statusCode: HttpStatus.NOT_FOUND,
      };
    }

    const code = randomBytes(8).toString('hex').toUpperCase();
    const delivery = await this.prisma.deliveryOrder.create({
      data: {
        lockerId: data.lockerId,
        boardId: data.boardId,
        pickupCode: code,
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
      where: { id: Number(data.lockerId) },
      data: { status: 'PENDING' },
    });

    const container = await this.prisma.container.findUnique({
      where: { boardId: data.boardId },
    });

    // Send SMS notification
    await this.smsService.sendPickupCode(data.pickupMobile, container?.location ? container.location : '', code, delivery.id);

    return {
      success: true,
      message: 'Delivery started successfully',
      data: delivery,
    };
  }


  
}
