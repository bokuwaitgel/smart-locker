import { Injectable, HttpStatus, HttpException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from 'src/sms/sms.service';
import { CreatePaymentDto, CreateInvoiceDto, CheckInvoiceDto } from './dto';
import axios from 'axios';

import {
  PaymentNotProcessedException,
  ResourceConflictException,
} from 'src/common/exceptions/custom.exception';
import { DeliveryGateway } from 'src/delivery/delivery.gateway';

@Injectable()
export class PaymentService {
    constructor(
        private prisma: PrismaService,
        private smsService: SmsService,
        @Inject(forwardRef(() => DeliveryGateway)) private deliveryGateway: DeliveryGateway,
    ) {}
  private readonly apiUrl = 'https://merchant.qpay.mn/v2';
  private authToken: string | null = null;

   async getAuthToken(): Promise<any> {
    try {
      const requestConfig = {
        url: `${this.apiUrl}/auth/token`,
        method: 'POST',
        auth: {
          username: process.env.QPAY_USERNAME || '',
          password: process.env.QPAY_PASSWORD || '',
        },
      };

      return axios(requestConfig)
        .then(async (response) => {
          
          const res = {
            access_token: response.data['access_token'],
            refresh_token: response.data['refresh_token'],
            expires_in: response.data['expires_in'],
            refresh_expires_in: response.data['refresh_expires_in'],
          };

          // Save the token to the database
          const token = await this.prisma.qPayToken.findFirst({
            where: {
              paymentId: 1, // Assuming you have a single token for the application
            },
          });


          if (token) {
            await this.prisma.qPayToken.update({
              where: { id: token.id },
              data: {
                accessToken: res.access_token,
                refreshToken: res.refresh_token,
                expiresIn: res.expires_in,
                refreshExpiresIn: res.refresh_expires_in,
              },
            });
          } else {
            await this.prisma.qPayToken.create({
              data: {
                paymentId: 1, // Assuming you have a single token for the application
                accessToken: res.access_token,
                refreshToken: res.refresh_token,
                expiresIn: res.expires_in,
                refreshExpiresIn: res.refresh_expires_in,
              },
            });
          }
          
          return {
            status: true,
            type: 'success',
            code: HttpStatus.OK,
            data: res,
          };
        })
        .catch((error) => {
          console.log(error);
          return {
            status: false,
            type: 'error',
            code: HttpStatus.INTERNAL_SERVER_ERROR,
          };
        });
    } catch (error) {
      throw new Error('Failed to obtain authentication token');
    }
  }

   async createInvoice(
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<any> {
    try {
      const paymentModel = await this.prisma.payment.create({
        data: {
          amount: createInvoiceDto.amount,
          deliveryId: createInvoiceDto.deliveryId,
          status: 'UNPAID',
        },
      });

      const postData = {
        invoice_code: 'MYAGMARCHULUUN_B_INVOICE',
        sender_invoice_no: '1234567',
        invoice_receiver_code: 'MYAGMARCHULUUN_B_INVOICE',
        invoice_description: '24/7 box',
        sender_branch_code: 'App',
        amount: createInvoiceDto.amount,
        callback_url: `http://143.110.184.5:3030/payments/verify/${paymentModel.id}/${createInvoiceDto.deliveryId}`,
      };
      const url = `${this.apiUrl}/invoice`;

      const token = await this.prisma.qPayToken.findFirst({
        where: {
          paymentId: 1,
        },
      });
      let bearerToken = '';
      if(!token) {
        const res = await this.getAuthToken();

        bearerToken = res.data.access_token;
      } else {
        bearerToken = token.accessToken;
      }

      const headers = {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      };
      return axios
        .post(url, postData, { headers })
        .then(async (response) => {
          await this.prisma.payment.update({
            where: {
              id: paymentModel.id,
            },
            data: {
              InvoiceId: response.data.invoice_id,
            },
          });

          return {
            status: true,
            type: 'success',
            code: HttpStatus.OK,
            data: response.data,
          };
        })
        .catch(async (error) => {
          if (error.response && error.response.status === 401) {
            await this.getAuthToken();
            return await this.createInvoice(createInvoiceDto);
          }
          throw new Error(`${error}`);
        });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async checkInvoice(invoiceId: string): Promise<any> {
    console.log('Checking Invoice:', invoiceId);
    const postData = {
      object_type: 'INVOICE',
      object_id: invoiceId,
      offset: {
        page_number: 1,
        page_limit: 100,
      },
    };
    const url = `${this.apiUrl}/payment/check`;



    const token = await this.prisma.qPayToken.findFirst(
      {
        where: {
          id: 1, // Assuming you have a single token for the application
        },
      },
    );
    if (!token) {
      throw new HttpException('QPay token not found', HttpStatus.UNAUTHORIZED);
    }
    const bearerToken = token.accessToken;
    const headers = {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    };
    return axios
      .post(url, postData, { headers })
      .then((response) => {
        return {
          status: true,
          type: 'success',
          code: HttpStatus.OK,
          data: response.data,
        };
      })
      .catch(async (error) => {
        if (error.response && error.response.status === 401) {
          await this.getAuthToken();
          return await this.checkInvoice(invoiceId);
        }
        throw new Error(`${error}`);
      });
  }

  async verifyInvoice(
    paymentId: string,
    deliveryId: string,
  ): Promise<any> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: Number(paymentId),
      }
    });

    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    const delivery = await this.prisma.deliveryOrder.findUnique({
      where: { id: Number(deliveryId) },
    });

    if (!delivery) {
      throw new HttpException('Delivery order not found', HttpStatus.NOT_FOUND);
    }

    if (payment.status === 'PAID') {
      this.deliveryGateway.handlePayment({
        deliveryId: delivery.id,
        boardId: delivery.boardId,
        lockerId: delivery.lockerId,
        paymentId: payment.id,
        paymentStatus: payment.status,
      });
      return {
        success: true,
        type: 'success',
        message: 'Payment already verified',
        statusCode: HttpStatus.OK,
        data: payment,
      };
    }

    const invoiceId = payment.InvoiceId;

    if (!invoiceId) {
      throw new HttpException('Invoice ID not found', HttpStatus.NOT_FOUND);
    }

    const response = await this.checkInvoice(invoiceId);
    if (response.data.count > 0) {
      const transaction = await this.prisma.$transaction(
        async (tx) => {
          const updatedPayment = await tx.payment.updateMany({
            where: {
              id: Number(paymentId),
              status: 'UNPAID',
            },
            data: {
              status: 'PAID',
              updatedAt: new Date(),
            },
          });
          if (updatedPayment.count > 0) {
            // Notify user about successful payment
            console.log('Sending notification to user for successful payment');
            await this.smsService.sendDeliveryNotification(
              delivery.pickupMobile,
              `Таны захиалга амжилттай төлөгдлөө. Код: ${delivery.pickupCode}`
            );

          }

          // Update delivery status to PAID
          const updatedDelivery = await tx.deliveryOrder.update({
            where: { id: Number(deliveryId) },
            data: {
              paymentStatus: 'PAID',
            },
          });

          // send gateway message to delivery service
          this.deliveryGateway.handlePayment({
            deliveryId: delivery.id,
            boardId: delivery.boardId,
            lockerId: delivery.lockerId,
            paymentId: payment.id,
            paymentStatus: payment.status,
          });
          
          

          if (updatedPayment.count == 0) {
            throw new ResourceConflictException(
              `Баталгаажсан гүйлгээ байна.`,
            );
          }
        }
      );
      return transaction;
    } else {
      throw new PaymentNotProcessedException(`Төлбөр хийгдээгүй байна.`);
    }
  } 

  async checkPaymentWithInvoice(invoiceId: string): Promise<any> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        InvoiceId: invoiceId,
      },
    });

    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }
    const delivery = await this.prisma.deliveryOrder.findUnique({
        where: { id: payment.deliveryId },
      });
    if (!delivery) {
      throw new HttpException('Delivery order not found', HttpStatus.NOT_FOUND);
    }


    if (payment.status === 'PAID') {
      
  
      // send gateway message to delivery service
      this.deliveryGateway.handlePayment( {
        deliveryId: delivery.id,
        boardId: delivery.boardId,
        lockerId: delivery.lockerId,
        paymentId: payment.id,
        paymentStatus: payment.status,
      });
      return {
        status: true,
        type: 'success',
        code: HttpStatus.OK,
        data: payment,
      };
    } else {
      const response = await this.checkInvoice(invoiceId);
      if (response.data.count > 0) {
        const transaction = await this.prisma.$transaction(
          async (tx) => {
            const updatedPayment = await tx.payment.updateMany({
              where: {
                id: Number(payment.id),
                status: 'UNPAID',
              },
              data: {
                status: 'PAID',
                updatedAt: new Date(),
              },
            });
            if (updatedPayment.count > 0) {
              // Notify user about successful payment
              console.log('Sending notification to user for successful payment');
              await this.smsService.sendDeliveryNotification(
                delivery.pickupMobile,
                `Таны захиалга амжилттай төлөгдлөө. Код: ${delivery.pickupCode}`
              );

            }

            // Update delivery status to PAID
            const updatedDelivery = await tx.deliveryOrder.update({
              where: { id: Number(delivery.id) },
              data: {
                paymentStatus: 'PAID',
              },
            });

            // send gateway message to delivery service
            this.deliveryGateway.handlePayment({
              deliveryId: delivery.id,
              boardId: delivery.boardId,
              lockerId: delivery.lockerId,
              paymentId: payment.id,
              paymentStatus: payment.status,
            });
            
            

            if (updatedPayment.count == 0) {
              throw new ResourceConflictException(
                `Баталгаажсан гүйлгээ байна.`,
              );
            }
          }
        );
      return {
        status: false,
        type: 'error',
        code: HttpStatus.BAD_REQUEST,
        message: 'Payment is not successful',
      };
    }
  }
  }

}
