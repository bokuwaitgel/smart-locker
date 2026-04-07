import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Inject, forwardRef, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentService } from 'src/payment/payment.service';

@WebSocketGateway({
  pingInterval: 25000,
  pingTimeout: 10000,
})
export class DeliveryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(DeliveryGateway.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PaymentService)) private readonly paymentService: PaymentService,
  ) {}
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    client.removeAllListeners();
  }
  
  // create a message sender for the delivery service
  @SubscribeMessage('sendToDeliveryService')
  handleMessage(@MessageBody() message: string): void {
    this.logger.log(`Message to delivery service: ${message}`);
    this.server.emit('sendToDeliveryService', message + ' from backend');
  }

  @SubscribeMessage('PaymentCheck')
  async handlePaymentCheck(@MessageBody() data: { pickupCode: string }): Promise<void> {
    try {
      this.logger.log(`Payment check requested for pickup code: ${data.pickupCode}`);

      const delivery = await this.prisma.deliveryOrder.findFirst({
        where: { pickupCode: data.pickupCode },
      });

      if (!delivery) {
        this.logger.warn(`No delivery found for pickup code: ${data.pickupCode}`);
        return;
      }

      const payment = await this.prisma.payment.findFirst({
        where: { deliveryId: delivery.id },
      });

      if (!payment) {
        this.logger.warn(`No payment found for delivery ID: ${delivery.id}`);
        return;
      }

      if (payment.status !== 'PAID') {
        const invoice = payment.InvoiceId;
        if (invoice) {
          await this.paymentService.checkPaymentWithInvoice(invoice);
        }
      }

      this.server.emit('PaymentStatus', {
        pickupCode: data.pickupCode,
        paymentStatus: payment.status,
      });
    } catch (error) {
      this.logger.error(`PaymentCheck failed for ${data.pickupCode}: ${error.message}`, error.stack);
    }
  }

  @SubscribeMessage('paymentGateway')
  async handlePayment(@MessageBody() paymentInfo: {
    paymentId: number;
    deliveryId: number;
    boardId: string;
    lockerId: string;
    paymentStatus: string;
  }): Promise<void> {
    try {
      this.logger.log(`Payment information received: ${JSON.stringify(paymentInfo)}`);

      if (paymentInfo.paymentStatus === 'PAID') {
        const locker = await this.prisma.locker.findUnique({
          where: { lockerNumber: paymentInfo.lockerId },
        });

        if (!locker) {
          this.logger.warn(`Locker not found for ID: ${paymentInfo.lockerId}`);
          return;
        }
        this.server.emit(paymentInfo.boardId, {
          action: 'unlock',
          lockerId: paymentInfo.lockerId,
          lockerIndex: locker.lockerIndex,
          reason: 'Payment successful',
        });
      }
    } catch (error) {
      this.logger.error(`handlePayment failed: ${error.message}`, error.stack);
    }
  }

  @SubscribeMessage('openLocker')
  async handleOpenLocker(@MessageBody() data: { boardId: string; lockerId: string; reason: string }): Promise<void> {
    try {
      this.logger.log(`Open locker request received: ${JSON.stringify(data)}`);

      const locker = await this.prisma.locker.findUnique({
        where: { lockerNumber: data.lockerId },
      });

      if (!locker) {
        this.logger.warn(`Locker not found for ID: ${data.lockerId}`);
        return;
      }

      this.server.emit(data.boardId, {
        action: 'unlock',
        lockerId: data.lockerId,
        lockerIndex: locker.lockerIndex,
        reason: data.reason,
      });
    } catch (error) {
      this.logger.error(`openLocker failed: ${error.message}`, error.stack);
    }
  }
}