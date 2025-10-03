import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  StartDeliveryDto,
  PickupRequestDto,
  InitBoardDto,
} from './delivery.dto';
import { randomBytes, randomFill } from 'crypto';
import { SmsService } from '../sms/sms.service';
import { PaymentService } from 'src/payment/payment.service';
import { create } from 'domain';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
    private paymentService: PaymentService,
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

      this.logger.debug(
        `Calculated delivery price: ${basePrice} for delivery ${delivery.id}`,
      );

      return basePrice;
    } catch (error) {
      this.logger.error(`Failed to calculate delivery price: ${error.message}`);
      return 100; // Fallback to base price
    }
  }

  async initBoardLockers(data: InitBoardDto) {
    try {
      this.logger.log(`Initializing lockers for board: ${data.boardId}`);

      //check board 
      let board = await this.prisma.container.findUnique({
        where: { boardId: data.boardId },
      });

      if (!board) {
        this.logger.warn(`Board not found: ${data.boardId}`);
        // create board
         board = await this.prisma.container.create({
          data: { boardId: data.boardId },
        });
        this.logger.log(`Created new board: ${board.id}`);


         // Create lockers for the board 16
        const lockers = await this.prisma.locker.createMany({
          data: Array.from({ length: data.numberOfLockers }, (_, i) => ({
            boardId: data.boardId,
            lockerIndex: i,
            lockerNumber: `${data.boardId}_Locker${String(i + 1).padStart(3, '0')}`,
            status: 'AVAILABLE',
            description: `Locker ${i + 1} in board ${data.boardId}`,
          })),
        });
      }

      const lockers = await this.prisma.locker.findMany({
        where: { boardId: data.boardId },
      });

      return {
        success: true,
        type: 'success',
        message: 'Lockers initialized successfully',
        statusCode: HttpStatus.CREATED,
        data: {
          boardId: data.boardId,
          numberOfLockers: lockers.length,
          location: board.location,
          createdAt: board.createdAt
        },
      };

    } catch (error) {
      this.logger.error(`Failed to initialize lockers for board ${data.boardId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to initialize lockers');
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

      this.logger.log(
        `Found ${container.Lockers.length} lockers for board ${boardId}`,
      );

      // order lockers by index
      container.Lockers.sort((a, b) => a.lockerIndex - b.lockerIndex);

      return {
        success: true,
        type: 'success',
        message: 'Locker status retrieved successfully',
        statusCode: HttpStatus.OK,
        data: container.Lockers,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get locker status for board ${boardId}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to retrieve locker status',
      );
    }
  }

  async requestPickup(data: PickupRequestDto) {
    try {
      this.logger.log(`Processing pickup request for code: ${data.pickupCode}`);

      const delivery = await this.prisma.deliveryOrder.findUnique({
        where: { pickupCode: data.pickupCode },
      });

      if (!delivery) {
        this.logger.warn(
          `Delivery order not found for pickup code: ${data.pickupCode}`,
        );
        return {
          success: false,
          type: 'error',
          message: 'Delivery order not found. Please check your pickup code.',
          statusCode: HttpStatus.NOT_FOUND,
        };
      }

      if (delivery.status !== 'WAITING') {
        this.logger.warn(
          `Delivery order ${delivery.id} is not in WAITING status: ${delivery.status}`,
        );
        return {
          success: false,
          type: 'error',
          message: `Delivery order is not ready for pickup. Current status: ${delivery.status}`,
          statusCode: HttpStatus.BAD_REQUEST,
        };
      }

      // Check payment status
      if (delivery.paymentStatus !== 'PAID') {
        this.logger.log(
          `Payment not completed for delivery ${delivery.id}, creating invoice`,
        );

        // Calculate price based on delivery details
        const amount = await this.calculateDeliveryPrice(delivery);

        try {
          const payment = await this.paymentService.createInvoice({
            amount,
            deliveryId: delivery.id,
          });

          if (!payment) {
            this.logger.error(
              `Failed to create payment for delivery ${delivery.id}`,
            );
            return {
              success: false,
              type: 'error',
              message: 'Failed to create payment invoice',
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            };
          }

          this.logger.log(
            `Payment invoice created for delivery ${delivery.id}`,
          );
          return payment;
        } catch (error) {
          this.logger.error(
            `Payment creation failed for delivery ${delivery.id}: ${error.message}`,
            error.stack,
          );
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
        this.logger.error(
          `Failed to update delivery status for pickup code: ${data.pickupCode}`,
        );
        return {
          success: false,
          type: 'error',
          message: 'Failed to update delivery status',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
      }

      // Update locker status to AVAILABLE
      const locker = await this.prisma.locker.update({
        where: { lockerNumber: updatedDelivery.lockerId },
        data: { status: 'AVAILABLE' },
      });

      this.logger.log(
        `Pickup completed successfully for delivery ${delivery.id}`,
      );

      return {
        success: true,
        message: 'Pickup request successful',
        data: {
          delivery: updatedDelivery,
          lockerId: updatedDelivery.lockerId,
          lockerIndex: locker.lockerIndex,
          pickedUpAt: updatedDelivery.pickedUpAt,
        },
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process pickup request for code ${data.pickupCode}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to process pickup request',
      );
    }
  }

  async checkPayment(data: PickupRequestDto) {
    try {
      this.logger.log(
        `Checking payment status for pickup code: ${data.pickupCode}`,
      );

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

      const payment = await this.prisma.payment.findFirst({
        where: { deliveryId: delivery.id },
      });

      if (!payment) {
        return {
          success: false,
          type: 'error',
          message: 'Payment not found',
          statusCode: HttpStatus.NOT_FOUND,
        };
      }
  
      const invoice = payment.InvoiceId
      if (invoice) {
        const res = await this.paymentService.checkPaymentWithInvoice(invoice);
      }
      
      const locker = await this.prisma.locker.findUnique({
        where: { lockerNumber: delivery.lockerId },
      });


      return {
        success: true,
        message: 'Payment status retrieved successfully',
        data: {
          deliveryId: delivery.id,
          pickupCode: data.pickupCode,
          lockerIndex : locker?.lockerIndex,
          paymentStatus: delivery.paymentStatus,
          status: delivery.status,
        },
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(
        `Failed to check payment for pickup code ${data.pickupCode}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to check payment status');
    }
  }


  async generatePickupCode(): Promise<string> {
    let code = '';

    while(true) {
      // genereate code 6 digits
      code = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await this.prisma.deliveryOrder.findUnique({
        where: { pickupCode: code },
      });
      if (!existing) break; // ensure uniqueness
    }
    
    return code;
  }

  async startDelivery(data: StartDeliveryDto) {
    try {
      this.logger.log(
        `Starting delivery for locker ${data.lockerNumber} in board ${data.boardId}`,
      );

      // Validate locker availability
      const locker = await this.prisma.locker.findUnique({
        where: { lockerNumber: data.lockerNumber },
      });

      if (!locker) {
        throw new NotFoundException(`Locker ${data.lockerNumber} not found`);
      }

      if (locker.status !== 'AVAILABLE') {
        throw new BadRequestException(
          `Locker ${data.lockerNumber} is not available. Current status: ${locker.status}`,
        );
      }

      // Validate container exists
      const container = await this.prisma.container.findUnique({
        where: { boardId: data.boardId },
      });

      if (!container) {
        throw new NotFoundException(
          `Container with board ID ${data.boardId} not found`,
        );
      }

      // Generate unique pickup code
      const code = await this.generatePickupCode();

      // Create delivery order
      const delivery = await this.prisma.deliveryOrder.create({
        data: {
          lockerId: data.lockerNumber,
          boardId: data.boardId,
          pickupCode: code,
          pickupMobile: data.pickupMobile,
          status: 'WAITING',
          paymentStatus: 'UNPAID',
          deliveredAt: new Date(),
        },
      });

      if (!delivery) {
        throw new InternalServerErrorException(
          'Failed to create delivery order',
        );
      }

      // Update locker status to OCCUPIED
      await this.prisma.locker.update({
        where: { lockerNumber: data.lockerNumber },
        data: { status: 'OCCUPIED' },
      });

      // Send SMS notification
      try {
        await this.smsService.sendPickupCode(
          data.pickupMobile,
          container.location || 'Smart Locker',
          code,
          delivery.id,
        );
        this.logger.log(`SMS notification sent to ${data.pickupMobile}`);
      } catch (smsError) {
        this.logger.error(
          `Failed to send SMS notification: ${smsError.message}`,
        );
        // Don't fail the delivery if SMS fails
      }

      this.logger.log(`Delivery started successfully with ID: ${delivery.id}`);

      return {
        success: true,
        message: 'Delivery started successfully',
        data: {
          deliveryId: delivery.id,
          pickupCode: code,
          lockerNumber: data.lockerNumber,
          status: delivery.status,
          deliveredAt: delivery.deliveredAt,
        },
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      this.logger.error(
        `Failed to start delivery: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to start delivery');
    }
  }

  async getDeliveries(boardId?: string, status?: string) {
    const where: any = {};
    if (boardId) where.boardId = boardId;
    if (status) where.status = status as any; // Cast to match DeliveryStatus

    const data = await this.prisma.deliveryOrder.findMany({
      include: { Container: true, Locker: true },
      where,
    });
    return {
      success: true,
      message: 'Fetched all deliveries successfully',
      data: data
    };
  }

}
