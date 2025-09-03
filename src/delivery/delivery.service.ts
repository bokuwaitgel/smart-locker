import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartDeliveryDto, PickupRequestDto, CancelDeliveryDto, UpdateDeliveryStatusDto, DeliveryHistoryDto } from './delivery.dto';
import { randomBytes } from 'crypto';
import { SmsService } from '../sms/sms.service';
import { PaymentService } from 'src/payment/payment.service';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
    private paymentService: PaymentService
  ) {}

  // Calculate delivery price based on various factors
  private async calculateDeliveryPrice(delivery: any): Promise<number> {
    try {
      // Base price for delivery
      let basePrice = 100; // Base price in MNT

      // Get container information for location-based pricing
      const container = await this.prisma.container.findUnique({
        where: { boardId: delivery.boardId },
      });

      // Add premium for certain locations (example logic)
      if (container?.location?.toLowerCase().includes('central')) {
        basePrice += 50; // Premium location surcharge
      }

      // Add size-based pricing if we had size information
      // For now, using a simple calculation

      this.logger.debug(`Calculated delivery price: ${basePrice} for delivery ${delivery.id}`);

      return basePrice;
    } catch (error) {
      this.logger.error(`Failed to calculate delivery price: ${error.message}`);
      return 100; // Fallback to base price
    }
  }

  async getLockerStatus(boardId: string) {
    try {
      this.logger.log(`Getting locker status for board: ${boardId}`);

      const container = await this.prisma.container.findUnique({
        where: { boardId: boardId },
        include: { Lockers: true },
      });

      if (!container) {
        throw new NotFoundException('Container not found');
      }

      this.logger.log(`Found ${container.Lockers.length} lockers for board ${boardId}`);

      return {
        success: true,
        type: 'success',
        message: 'Locker status retrieved successfully',
        statusCode: HttpStatus.OK,
        data: container.Lockers,
      };
    } catch (error) {
      this.logger.error(`Failed to get locker status for board ${boardId}: ${error.message}`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to retrieve locker status');
    }
  }

  async requestPickup(data: PickupRequestDto) {
    try {
      this.logger.log(`Processing pickup request for code: ${data.pickupCode}`);

      const delivery = await this.prisma.deliveryOrder.findUnique({
        where: { pickupCode: data.pickupCode },
      });

      if (!delivery) {
        this.logger.warn(`Delivery order not found for pickup code: ${data.pickupCode}`);
        return {
          success: false,
          type: 'error',
          message: 'Delivery order not found. Please check your pickup code.',
          statusCode: HttpStatus.NOT_FOUND,
        };
      }

      if (delivery.status !== 'WAITING') {
        this.logger.warn(`Delivery order ${delivery.id} is not in WAITING status: ${delivery.status}`);
        return {
          success: false,
          type: 'error',
          message: `Delivery order is not ready for pickup. Current status: ${delivery.status}`,
          statusCode: HttpStatus.BAD_REQUEST,
        };
      }

      // Check payment status
      if (delivery.paymentStatus !== 'PAID') {
        this.logger.log(`Payment not completed for delivery ${delivery.id}, creating invoice`);

        // Calculate price based on delivery details
        const amount = await this.calculateDeliveryPrice(delivery);

        try {
          const payment = await this.paymentService.createInvoice({
            amount,
            deliveryId: delivery.id,
          });

          if (!payment) {
            this.logger.error(`Failed to create payment for delivery ${delivery.id}`);
            return {
              success: false,
              type: 'error',
              message: 'Failed to create payment invoice',
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            };
          }

          this.logger.log(`Payment invoice created for delivery ${delivery.id}`);
          return payment;

        } catch (error) {
          this.logger.error(`Payment creation failed for delivery ${delivery.id}: ${error.message}`, error.stack);
          return {
            success: false,
            type: 'error',
            message: 'Failed to process payment. Please try again.',
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
        this.logger.error(`Failed to update delivery status for pickup code: ${data.pickupCode}`);
        return {
          success: false,
          type: 'error',
          message: 'Failed to update delivery status',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
      }

      // Update locker status to AVAILABLE
      await this.prisma.locker.update({
        where: { lockerNumber: updatedDelivery.lockerId },
        data: { status: 'AVAILABLE' },
      });

      this.logger.log(`Pickup completed successfully for delivery ${delivery.id}`);

      return {
        success: true,
        message: 'Pickup request successful',
        data: {
          delivery: updatedDelivery,
          lockerId: updatedDelivery.lockerId,
          pickedUpAt: updatedDelivery.pickedUpAt
        },
        statusCode: HttpStatus.OK,
      };

    } catch (error) {
      this.logger.error(`Failed to process pickup request for code ${data.pickupCode}: ${error.message}`, error.stack);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to process pickup request');
    }
  }

  async checkPayment(data: PickupRequestDto) {
    try {
      this.logger.log(`Checking payment status for pickup code: ${data.pickupCode}`);

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

      return {
        success: true,
        message: 'Payment status retrieved successfully',
        data: {
          deliveryId: delivery.id,
          pickupCode: data.pickupCode,
          paymentStatus: delivery.paymentStatus,
          status: delivery.status
        },
        statusCode: HttpStatus.OK,
      };

    } catch (error) {
      this.logger.error(`Failed to check payment for pickup code ${data.pickupCode}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to check payment status');
    }
  }


  async startDelivery(data: StartDeliveryDto) {
    try {
      this.logger.log(`Starting delivery for locker ${data.lockerId} in board ${data.boardId}`);

      // Validate locker availability
      const locker = await this.prisma.locker.findUnique({
        where: { lockerNumber: data.lockerId },
      });

      if (!locker) {
        throw new NotFoundException(`Locker ${data.lockerId} not found`);
      }

      if (locker.status !== 'AVAILABLE') {
        throw new BadRequestException(`Locker ${data.lockerId} is not available. Current status: ${locker.status}`);
      }

      // Validate container exists
      const container = await this.prisma.container.findUnique({
        where: { boardId: data.boardId },
      });

      if (!container) {
        throw new NotFoundException(`Container with board ID ${data.boardId} not found`);
      }

      // Generate unique pickup code
      const code = randomBytes(4).toString('hex').toUpperCase();
      this.logger.debug(`Generated pickup code: ${code}`);

      // Create delivery order
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
        throw new InternalServerErrorException('Failed to create delivery order');
      }

      // Update locker status to OCCUPIED
      await this.prisma.locker.update({
        where: { lockerNumber: data.lockerId },
        data: { status: 'OCCUPIED' },
      });

      // Send SMS notification
      try {
        await this.smsService.sendPickupCode(
          data.pickupMobile,
          container.location || 'Smart Locker',
          code,
          delivery.id
        );
        this.logger.log(`SMS notification sent to ${data.pickupMobile}`);
      } catch (smsError) {
        this.logger.error(`Failed to send SMS notification: ${smsError.message}`);
        // Don't fail the delivery if SMS fails
      }

      this.logger.log(`Delivery started successfully with ID: ${delivery.id}`);

      return {
        success: true,
        message: 'Delivery started successfully',
        data: {
          deliveryId: delivery.id,
          pickupCode: code,
          lockerId: data.lockerId,
          status: delivery.status,
          deliveredAt: delivery.deliveredAt
        },
        statusCode: HttpStatus.CREATED,
      };

    } catch (error) {
      this.logger.error(`Failed to start delivery: ${error.message}`, error.stack);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to start delivery');
    }
  }

  // Cancel a delivery
  async cancelDelivery(data: CancelDeliveryDto) {
    try {
      this.logger.log(`Cancelling delivery with pickup code: ${data.pickupCode}`);

      const delivery = await this.prisma.deliveryOrder.findUnique({
        where: { pickupCode: data.pickupCode },
      });

      if (!delivery) {
        throw new NotFoundException('Delivery order not found');
      }

      if (delivery.status === 'CANCELLED') {
        throw new BadRequestException('Delivery is already cancelled');
      }

      if (delivery.status === 'PICKED_UP') {
        throw new BadRequestException('Cannot cancel a delivery that has been picked up');
      }

      // Update delivery status to CANCELLED
      const updatedDelivery = await this.prisma.deliveryOrder.update({
        where: { pickupCode: data.pickupCode },
        data: {
          status: 'CANCELLED',
        },
      });

      // Update locker status back to AVAILABLE
      await this.prisma.locker.update({
        where: { lockerNumber: delivery.lockerId },
        data: { status: 'AVAILABLE' },
      });

      this.logger.log(`Delivery ${delivery.id} cancelled successfully`);

      return {
        success: true,
        message: 'Delivery cancelled successfully',
        data: {
          deliveryId: delivery.id,
          pickupCode: data.pickupCode,
          cancelledAt: new Date(),
          reason: data.reason
        },
        statusCode: HttpStatus.OK,
      };

    } catch (error) {
      this.logger.error(`Failed to cancel delivery ${data.pickupCode}: ${error.message}`, error.stack);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to cancel delivery');
    }
  }

  // Update delivery status
  async updateDeliveryStatus(data: UpdateDeliveryStatusDto) {
    try {
      this.logger.log(`Updating delivery status for pickup code: ${data.pickupCode} to ${data.status}`);

      const delivery = await this.prisma.deliveryOrder.findUnique({
        where: { pickupCode: data.pickupCode },
      });

      if (!delivery) {
        throw new NotFoundException('Delivery order not found');
      }

      const updatedDelivery = await this.prisma.deliveryOrder.update({
        where: { pickupCode: data.pickupCode },
        data: {
          status: data.status,
          ...(data.status === 'PICKED_UP' && { pickedUpAt: new Date() }),
        },
      });

      // Update locker status if delivery is picked up
      if (data.status === 'PICKED_UP') {
        await this.prisma.locker.update({
          where: { lockerNumber: delivery.lockerId },
          data: { status: 'AVAILABLE' },
        });
      }

      this.logger.log(`Delivery ${delivery.id} status updated to ${data.status}`);

      return {
        success: true,
        message: 'Delivery status updated successfully',
        data: {
          deliveryId: delivery.id,
          pickupCode: data.pickupCode,
          status: data.status,
          updatedAt: updatedDelivery.updatedAt
        },
        statusCode: HttpStatus.OK,
      };

    } catch (error) {
      this.logger.error(`Failed to update delivery status for ${data.pickupCode}: ${error.message}`, error.stack);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update delivery status');
    }
  }

  // Get delivery history with filters
  async getDeliveryHistory(filters: DeliveryHistoryDto) {
    try {
      this.logger.log(`Getting delivery history with filters: ${JSON.stringify(filters)}`);

      const where: any = {};

      if (filters.boardId) {
        where.boardId = filters.boardId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.pickupMobile) {
        where.pickupMobile = filters.pickupMobile;
      }

      const deliveries = await this.prisma.deliveryOrder.findMany({
        where,
        include: {
          Container: {
            select: {
              location: true,
              boardId: true
            }
          },
          Locker: {
            select: {
              lockerNumber: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: filters.skip || 0,
        take: filters.limit || 10,
      });

      const total = await this.prisma.deliveryOrder.count({ where });

      this.logger.log(`Found ${deliveries.length} deliveries out of ${total} total`);

      return {
        success: true,
        message: 'Delivery history retrieved successfully',
        data: {
          deliveries,
          total,
          limit: filters.limit || 10,
          skip: filters.skip || 0
        },
        statusCode: HttpStatus.OK,
      };

    } catch (error) {
      this.logger.error(`Failed to get delivery history: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve delivery history');
    }
  }

  // Get delivery statistics
  async getDeliveryStats() {
    try {
      this.logger.log('Getting delivery statistics');

      const [
        totalDeliveries,
        waitingDeliveries,
        pickedUpDeliveries,
        cancelledDeliveries,
        paidDeliveries,
        unpaidDeliveries
      ] = await Promise.all([
        this.prisma.deliveryOrder.count(),
        this.prisma.deliveryOrder.count({ where: { status: 'WAITING' } }),
        this.prisma.deliveryOrder.count({ where: { status: 'PICKED_UP' } }),
        this.prisma.deliveryOrder.count({ where: { status: 'CANCELLED' } }),
        this.prisma.deliveryOrder.count({ where: { paymentStatus: 'PAID' } }),
        this.prisma.deliveryOrder.count({ where: { paymentStatus: 'UNPAID' } }),
      ]);

      const successRate = totalDeliveries > 0 ? (pickedUpDeliveries / totalDeliveries * 100).toFixed(2) : '0.00';
      const paymentRate = totalDeliveries > 0 ? (paidDeliveries / totalDeliveries * 100).toFixed(2) : '0.00';

      return {
        success: true,
        message: 'Delivery statistics retrieved successfully',
        data: {
          total: totalDeliveries,
          waiting: waitingDeliveries,
          pickedUp: pickedUpDeliveries,
          cancelled: cancelledDeliveries,
          paid: paidDeliveries,
          unpaid: unpaidDeliveries,
          successRate: `${successRate}%`,
          paymentRate: `${paymentRate}%`
        },
        statusCode: HttpStatus.OK,
      };

    } catch (error) {
      this.logger.error(`Failed to get delivery statistics: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve delivery statistics');
    }
  }

  // Get delivery by pickup code
  async getDeliveryByCode(pickupCode: string) {
    try {
      this.logger.log(`Getting delivery by pickup code: ${pickupCode}`);

      const delivery = await this.prisma.deliveryOrder.findUnique({
        where: { pickupCode },
        include: {
          Container: {
            select: {
              location: true,
              boardId: true
            }
          },
          Locker: {
            select: {
              lockerNumber: true,
              status: true
            }
          },
          Payment: {
            select: {
              amount: true,
              status: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
      });

      if (!delivery) {
        throw new NotFoundException('Delivery order not found');
      }

      return {
        success: true,
        message: 'Delivery retrieved successfully',
        data: delivery,
        statusCode: HttpStatus.OK,
      };

    } catch (error) {
      this.logger.error(`Failed to get delivery by code ${pickupCode}: ${error.message}`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to retrieve delivery');
    }
  }
}
