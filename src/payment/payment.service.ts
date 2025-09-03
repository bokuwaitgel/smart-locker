import { Injectable, NotFoundException, BadRequestException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from 'src/sms/sms.service';
import {
  CreatePaymentDto,
  CreateInvoiceDto,
  CheckInvoiceDto,
  PaymentResponseDto,
  PaymentStatsDto,
  QPayTokenResponseDto,
  InvoiceResponseDto,
  PaymentHistoryDto,
  RefundPaymentDto
} from './dto';
import axios, { AxiosResponse } from 'axios';
import { PaymentStatus, UserRole } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  private readonly apiUrl = 'https://merchant.qpay.mn/v2';

  async getAuthToken(): Promise<QPayTokenResponseDto> {
    try {
      const requestConfig = {
        url: `${this.apiUrl}/auth/token`,
        method: 'POST',
        auth: {
          username: process.env.QPAY_USERNAME || '',
          password: process.env.QPAY_PASSWORD || '',
        },
      };

      const response: AxiosResponse = await axios(requestConfig);

      const tokenData: QPayTokenResponseDto = {
        accessToken: response.data['access_token'],
        refreshToken: response.data['refresh_token'],
        expiresIn: response.data['expires_in'],
        refreshExpiresIn: response.data['refresh_expires_in'],
      };

      // Save or update the token in the database
      const existingToken = await this.prisma.qPayToken.findFirst();

      if (existingToken) {
        await this.prisma.qPayToken.update({
          where: { id: existingToken.id },
          data: {
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            expiresIn: tokenData.expiresIn,
            refreshExpiresIn: tokenData.refreshExpiresIn,
            updatedAt: new Date(),
          },
        });
      } else {
        await this.prisma.qPayToken.create({
          data: {
            paymentId: 0, // Use 0 for system-wide token
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            expiresIn: tokenData.expiresIn,
            refreshExpiresIn: tokenData.refreshExpiresIn,
          },
        });
      }

      return tokenData;
    } catch (error) {
      console.error('QPay authentication error:', error);
      throw new HttpException('Failed to authenticate with QPay', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createInvoice(createInvoiceDto: CreateInvoiceDto, userRole: UserRole = UserRole.USER): Promise<any> {
    try {
      // Check if delivery order exists
      const delivery = await this.prisma.deliveryOrder.findUnique({
        where: { id: createInvoiceDto.deliveryId },
      });

      if (!delivery) {
        throw new NotFoundException('Delivery order not found');
      }

      // Check if payment already exists for this delivery
      const existingPayment = await this.prisma.payment.findFirst({
        where: { deliveryId: createInvoiceDto.deliveryId },
      });

      if (existingPayment) {
        throw new BadRequestException('Payment already exists for this delivery order');
      }

      // Create payment record
      const payment = await this.prisma.payment.create({
        data: {
          amount: createInvoiceDto.amount,
          deliveryId: createInvoiceDto.deliveryId,
          status: PaymentStatus.UNPAID,
        },
      });

      // Get or refresh QPay token
      let token = await this.prisma.qPayToken.findFirst();
      if (!token) {
        await this.getAuthToken();
        token = await this.prisma.qPayToken.findFirst();
      }

      if (!token) {
        throw new HttpException('QPay token not available', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // Create invoice with QPay
      const postData = {
        invoice_code: 'SMART_LOCKER_INVOICE',
        sender_invoice_no: `SL_${payment.id}_${Date.now()}`,
        invoice_receiver_code: 'SMART_LOCKER_PRO',
        invoice_description: createInvoiceDto.description || `Smart Locker Payment - Delivery #${createInvoiceDto.deliveryId}`,
        sender_branch_code: 'WEB_APP',
        amount: createInvoiceDto.amount,
        callback_url: `${process.env.BASE_URL || 'http://localhost:3000'}/api/payments/verify/${payment.id}/${createInvoiceDto.deliveryId}`,
      };

      const headers = {
        Authorization: `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json',
      };

      try {
        const response: AxiosResponse = await axios.post(`${this.apiUrl}/invoice`, postData, { headers });

        // Update payment with invoice ID
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { InvoiceId: response.data.invoice_id },
        });

        const invoiceResponse: InvoiceResponseDto = {
          invoice_id: response.data.invoice_id,
          invoice_url: response.data.invoice_url || '',
          qr_code: response.data.qr_code || '',
          amount: createInvoiceDto.amount,
          status: 'CREATED',
        };

        return {
          success: true,
          message: 'Invoice created successfully',
          data: {
            payment: this.formatPaymentResponse(payment),
            invoice: invoiceResponse,
          },
        };
      } catch (qpayError: any) {
        // If token is expired, refresh and retry
        if (qpayError.response?.status === 401) {
          await this.getAuthToken();
          return this.createInvoice(createInvoiceDto, userRole);
        }
        throw new HttpException(`QPay invoice creation failed: ${qpayError.message}`, HttpStatus.BAD_GATEWAY);
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Failed to create invoice');
    }
  }

  async checkInvoice(invoiceId: string): Promise<any> {
    try {
      const token = await this.prisma.qPayToken.findFirst();
      if (!token) {
        throw new HttpException('QPay token not available', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const postData = {
        object_type: 'INVOICE',
        object_id: invoiceId,
        offset: {
          page_number: 1,
          page_limit: 100,
        },
      };

      const headers = {
        Authorization: `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json',
      };

      try {
        const response: AxiosResponse = await axios.post(`${this.apiUrl}/payment/check`, postData, { headers });
        return {
          success: true,
          message: 'Invoice checked successfully',
          data: response.data,
        };
      } catch (qpayError: any) {
        if (qpayError.response?.status === 401) {
          await this.getAuthToken();
          return this.checkInvoice(invoiceId);
        }
        throw new HttpException(`QPay invoice check failed: ${qpayError.message}`, HttpStatus.BAD_GATEWAY);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Failed to check invoice');
    }
  }

  async verifyInvoice(paymentId: number, deliveryId: number): Promise<any> {
    try {
      // Validate payment exists
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { delivery: true },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Validate delivery exists
      const delivery = await this.prisma.deliveryOrder.findUnique({
        where: { id: deliveryId },
      });

      if (!delivery) {
        throw new NotFoundException('Delivery order not found');
      }

      // Check if already paid
      if (payment.status === PaymentStatus.PAID) {
        return {
          success: true,
          message: 'Payment already verified',
          data: this.formatPaymentResponse(payment),
        };
      }

      if (!payment.InvoiceId) {
        throw new BadRequestException('Invoice ID not found for this payment');
      }

      // Check payment status with QPay
      const invoiceCheck = await this.checkInvoice(payment.InvoiceId);

      if (invoiceCheck.data.count > 0) {
        // Payment successful - update database
        await this.prisma.$transaction(async (tx) => {
          // Update payment status
          await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: PaymentStatus.PAID,
              updatedAt: new Date(),
            },
          });

          // Update delivery payment status
          await tx.deliveryOrder.update({
            where: { id: deliveryId },
            data: {
              paymentStatus: PaymentStatus.PAID,
              updatedAt: new Date(),
            },
          });
        });

        // Send SMS notification
        try {
          await this.smsService.sendDeliveryNotification(
            delivery.pickupMobile,
            `Таны захиалга амжилттай төлөгдлөө. Код: ${delivery.pickupCode}`
          );
        } catch (smsError) {
          console.error('SMS notification failed:', smsError);
          // Don't fail the payment verification if SMS fails
        }

        // Get updated payment
        const updatedPayment = await this.prisma.payment.findUnique({
          where: { id: paymentId },
          include: { delivery: true },
        });

        return {
          success: true,
          message: 'Payment verified successfully',
          data: this.formatPaymentResponse(updatedPayment!),
        };
      } else {
        throw new BadRequestException('Payment not found in QPay system');
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Payment verification failed');
    }
  }

  async getPaymentById(id: number): Promise<any> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id },
        include: {
          delivery: true,
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      return {
        success: true,
        message: 'Payment retrieved successfully',
        data: this.formatPaymentResponse(payment),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve payment');
    }
  }

  async getPaymentsByDelivery(deliveryId: number): Promise<any> {
    try {
      const payments = await this.prisma.payment.findMany({
        where: { deliveryId },
        orderBy: { createdAt: 'desc' },
        include: {
          delivery: true,
        },
      });

      const formattedPayments = payments.map(payment => this.formatPaymentResponse(payment));

      return {
        success: true,
        message: 'Payments retrieved successfully',
        data: formattedPayments,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve payments');
    }
  }

  async getAllPayments(userRole: UserRole = UserRole.USER): Promise<any> {
    try {
      const payments = await this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          delivery: true,
        },
      });

      const formattedPayments = payments.map(payment => this.formatPaymentResponse(payment));

      return {
        success: true,
        message: 'Payments retrieved successfully',
        data: formattedPayments,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve payments');
    }
  }

  async getPaymentStats(): Promise<PaymentStatsDto> {
    try {
      const [
        totalPayments,
        paidPayments,
        unpaidPayments,
        failedPayments,
        totalAmountResult,
        paidAmountResult,
      ] = await Promise.all([
        this.prisma.payment.count(),
        this.prisma.payment.count({ where: { status: PaymentStatus.PAID } }),
        this.prisma.payment.count({ where: { status: PaymentStatus.UNPAID } }),
        this.prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
        this.prisma.payment.aggregate({ _sum: { amount: true } }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: PaymentStatus.PAID }
        }),
      ]);

      return {
        totalPayments,
        paidPayments,
        unpaidPayments,
        failedPayments,
        totalAmount: totalAmountResult._sum.amount || 0,
        paidAmount: paidAmountResult._sum.amount || 0,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve payment statistics');
    }
  }

  async checkPaymentWithInvoice(invoiceId: string): Promise<any> {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: { InvoiceId: invoiceId },
        include: {
          delivery: true,
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found for this invoice');
      }

      return {
        success: true,
        message: 'Payment found successfully',
        data: this.formatPaymentResponse(payment),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to check payment with invoice');
    }
  }

  async getPaymentHistory(userId?: number): Promise<any> {
    try {
      let payments;

      if (userId) {
        // If userId is provided, we need to join through delivery orders
        payments = await this.prisma.payment.findMany({
          where: {
            delivery: {
              // This assumes delivery orders have a userId field
              // Adjust based on your actual schema
            },
          },
          orderBy: { createdAt: 'desc' },
          include: {
            delivery: {
              include: {
                Container: true,
                Locker: true,
              },
            },
          },
          take: 50, // Limit to last 50 payments
        });
      } else {
        payments = await this.prisma.payment.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            delivery: {
              include: {
                Container: true,
                Locker: true,
              },
            },
          },
          take: 50, // Limit to last 50 payments
        });
      }

      const paymentHistory: PaymentHistoryDto[] = payments.map(payment => ({
        payment: this.formatPaymentResponse(payment),
        delivery: payment.delivery,
      }));

      return {
        success: true,
        message: 'Payment history retrieved successfully',
        data: paymentHistory,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve payment history');
    }
  }

  async cancelPayment(paymentId: number, userRole: UserRole = UserRole.USER): Promise<any> {
    // Only admins can cancel payments
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can cancel payments');
    }

    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { delivery: true },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.status === PaymentStatus.PAID) {
        throw new BadRequestException('Cannot cancel a paid payment');
      }

      // Update payment status to failed/cancelled
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Payment cancelled successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to cancel payment');
    }
  }

  private formatPaymentResponse(payment: any): PaymentResponseDto {
    const { delivery, ...paymentData } = payment;
    return {
      ...paymentData,
      delivery: delivery,
    };
  }
}

