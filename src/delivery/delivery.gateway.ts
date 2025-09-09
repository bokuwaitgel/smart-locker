import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { subscribe } from 'diagnostics_channel';
import { emit } from 'process';
import { Server } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentService } from 'src/payment/payment.service';

@WebSocketGateway()
export class DeliveryGateway {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PaymentService)) private readonly paymentService: PaymentService,
  ) {}
  @WebSocketServer()
  server: Server;
  
  // create a message sender for the delivery service
  @SubscribeMessage('sendToDeliveryService')
  handleMessage(@MessageBody() message: string): void {
    console.log('Message to delivery service:', message);
    this.server.emit('sendToDeliveryService', message + ' from backend');
  }

  @SubscribeMessage('PaymentCheck')
  async handlePaymentCheck(@MessageBody() data: { pickupCode: string }): Promise<void> {
    console.log('Payment check requested for pickup code:', data.pickupCode);

    // Implement payment check logic here
    const delivery = await this.prisma.deliveryOrder.findFirst({
      where: { pickupCode: data.pickupCode },
    });

    if (!delivery) {
      console.log('No delivery found for pickup code:', data.pickupCode);
      return;
    }

    // check payment status
    const payment = await this.prisma.payment.findFirst({
      where: { deliveryId: delivery.id },
    });
    
    if (!payment) {
      console.log('No payment found for delivery ID:', delivery.id);
      return;
    }

    if (payment.status !== 'PAID') {
      const invoice = payment.InvoiceId
      if (invoice) {
        const res = await this.paymentService.checkPaymentWithInvoice(invoice);
      }
    }

    console.log('Payment status for pickup code', data.pickupCode, ':', payment.status);

    if (delivery) {
      this.server.emit('PaymentStatus', {
        pickupCode: data.pickupCode,
        paymentStatus: payment.status,
      });
    }

  }

  //payment gateway 
  @SubscribeMessage('paymentGateway')
  async handlePayment(@MessageBody() paymentInfo: {
    paymentId: number;
    deliveryId: number;
    boardId: string;
    lockerId: string;
    paymentStatus: string;

  }): Promise<void> {
    console.log('Payment information received:', paymentInfo);

    if (paymentInfo.paymentStatus === 'PAID') {
      const locker = await this.prisma.locker.findUnique({
        where: { lockerNumber: paymentInfo.lockerId },
      });

      if (!locker) {
        console.log('Locker not found for ID:', paymentInfo.lockerId);
        return;
      }
      this.server.emit(paymentInfo.boardId, {
        action: 'unlock',
        lockerId: paymentInfo.lockerId,
        lockerIndex: locker.lockerIndex,
        reason: 'Payment successful',
      });
    }

    
  }
}