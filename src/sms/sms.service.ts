// src/sms/sms.service.ts
import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private rateLimits: Map<string, { count: number; resetTime: number }> =
    new Map();

  constructor(private prisma: PrismaService) {}
  

  // Simple rate limiting: max 10 SMS per hour per phone
  private checkRateLimit(phone: string): void {
    const now = Date.now();
    const key = phone;
    const maxRequests = 10;
    const windowMs = 60 * 60 * 1000; // 1 hour

    const entry = this.rateLimits.get(key);

    if (!entry || now > entry.resetTime) {
      this.rateLimits.set(key, { count: 1, resetTime: now + windowMs });
      return;
    }

    if (entry.count >= maxRequests) {
      const resetInMinutes = Math.ceil((entry.resetTime - now) / (60 * 1000));
      throw new Error(
        `Rate limit exceeded. Try again in ${resetInMinutes} minutes.`,
      );
    }

    entry.count++;
  }

  async sendSMS(phone: string, message: string) {
    try {
      // Basic validation
      if (!phone || !message) {
        return {
          success: false,
          message: 'Phone number and message are required',
          statusCode: HttpStatus.BAD_REQUEST,
        };
      }

      // // Check rate limit
      // this.checkRateLimit(phone);

      this.logger.log(
        `Sending SMS to ${phone}: ${message.substring(0, 50)}...`,
      );

      let config = {
          method: 'get',
          maxBodyLength: Infinity,
          url: `https://api.messagepro.mn/send?from=${process.env.FROM_NUMBER || '72729979'}&to=${phone}&text=${message}`,
          headers: {
            'x-api-key': process.env.CALL_PRO_KEY || 'ffb999795b180e5ae29d0c96378f22a1'
          }
      };

      let result = [];
      axios.request(config)
      .then(async (response) => {
        console.log(JSON.stringify(response.data));
        result = response.data;

        await this.prisma.sMS.create({
          data: {
            phoneNumber: phone,
            message: message,
            status: response.data[0].Result || 'sent',
          },
        });

        return {
            success: true,
            message: 'SMS sent successfully',
            data: result,
            statusCode: HttpStatus.OK,
          };
        })
      .catch((error) => {
        console.log(error);
        throw error;
      });
      
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${phone}: ${error.message}`,
        error.stack,
      );

      // Save failed SMS record
      try {
        await this.prisma.sMS.create({
          data: {
            phoneNumber: phone,
            message: message,
            status: 'failed',
          },
        });
      } catch (dbError) {
        this.logger.error(`Failed to save SMS record: ${dbError.message}`);
      }

      if (error.message.includes('Rate limit exceeded')) {
        return {
          success: false,
          message: error.message,
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
        };
      }

      return {
        success: false,
        message: 'Failed to send SMS',
        error: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async sendPickupCode(
    phone: string,
    lockerLocation: string,
    code: string,
    deliveryId: number,
  ) {
    try {
      // Basic validation
      if (!phone || !lockerLocation || !code) {
        return {
          success: false,
          message: 'Phone, locker location, and code are required',
          statusCode: HttpStatus.BAD_REQUEST,
        };
      }

      // Check rate limit
      this.checkRateLimit(phone);
    
      const message = `хүргэлтийн хайрцаг таны хүргэлтийг хүлээн авлаа! \nБайршил: ${lockerLocation} \nНууц код:: ${code}`;

      this.logger.log(
        `Sending pickup code SMS to ${phone} for delivery ${deliveryId}`,
      );
      
      let config = {
          method: 'get',
          maxBodyLength: Infinity,
          url: `https://api.messagepro.mn/send?from=${process.env.FROM_NUMBER || '72729979'}&to=${phone}&text=${message}`,
          headers: {
            'x-api-key': process.env.CALL_PRO_KEY || 'ffb999795b180e5ae29d0c96378f22a1'
          }
      };

      let result = [];
      axios.request(config)
      .then(async (response) => {
        console.log(JSON.stringify(response.data));
        result = response.data;

        await this.prisma.sMS.create({
          data: {
            phoneNumber: phone,
            message: message,
            status: response.data[0].Result || 'sent',
          },
        });

        // Update delivery order if ID provided
        if (deliveryId) {
          await this.prisma.deliveryOrder.update({
            where: { id: deliveryId },
            data: { isSendSMS: true },
          });
          this.logger.log(`Updated delivery order ${deliveryId} SMS status`);
        }

        this.logger.log(`Pickup code SMS sent successfully to ${phone}`);

        return {
          success: true,
          message: 'Pickup code SMS sent successfully',
          data: result,
          statusCode: HttpStatus.OK,
        };
      })
      .catch((error) => {
        console.log(error);
        throw error;
      });
    } catch (error) {
      this.logger.error(
        `Failed to send pickup code SMS to ${phone}: ${error.message}`,
        error.stack,
      );

      // Save failed SMS record
      try {
        await this.prisma.sMS.create({
          data: {
            phoneNumber: phone,
            message: `Таны илгээмж бэлэн боллоо!\nБайршил: ${lockerLocation}\nКод: ${code}`,
            status: 'failed',
          },
        });
      } catch (dbError) {
        this.logger.error(
          `Failed to save pickup SMS record: ${dbError.message}`,
        );
      }

      if (error.message.includes('Rate limit exceeded')) {
        return {
          success: false,
          message: error.message,
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
        };
      }

      return {
        success: false,
        message: 'Failed to send pickup code SMS',
        error: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async sendDeliveryCode(phone: string, code: string) {
    try {
      // Basic validation
      if (!phone || !code) {
        return {
          success: false,
          message: 'Phone and code are required',
          statusCode: HttpStatus.BAD_REQUEST,
        };
      }

      // Check rate limit
      this.checkRateLimit(phone);

      const message = `Таны илгээмж бэлэн боллоо!\nКод: ${code}`;

      this.logger.log(`Sending delivery code SMS to ${phone}`);

      let config = {
          method: 'get',
          maxBodyLength: Infinity,
          url: `https://api.messagepro.mn/send?from=${process.env.FROM_NUMBER || '72729979'}&to=${phone}&text=${message}`,
          headers: {
            'x-api-key': process.env.CALL_PRO_KEY || 'ffb999795b180e5ae29d0c96378f22a1'
          }
      };

      let result = [];
      axios.request(config)
      .then(async (response) => {
        console.log(JSON.stringify(response.data));
        result = response.data;


        // Save SMS record

        await this.prisma.sMS.create({
          data: {
            phoneNumber: phone,
            message: message,
            status: response.data[0].Result || 'sent',
          },
        });

        this.logger.log(`Delivery code SMS sent successfully to ${phone}`);

        return {
          success: true,
          message: 'Delivery code SMS sent successfully',
          data: result,
          statusCode: HttpStatus.OK,
        };
      })
      .catch((error) => {
        console.log(error);
        throw error;
      });

    } catch (error) {
      this.logger.error(
        `Failed to send delivery code SMS to ${phone}: ${error.message}`,
        error.stack,
      );

      // Save failed SMS record
      try {
        await this.prisma.sMS.create({
          data: {
            phoneNumber: phone,
            message: `Таны илгээмж бэлэн боллоо!\nКод: ${code}`,
            status: 'failed',
          },
        });
      } catch (dbError) {
        this.logger.error(
          `Failed to save delivery SMS record: ${dbError.message}`,
        );
      }

      if (error.message.includes('Rate limit exceeded')) {
        return {
          success: false,
          message: error.message,
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
        };
      }

      return {
        success: false,
        message: 'Failed to send delivery code SMS',
        error: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async sendDeliveryNotification(phone: string, message: string) {
    try {
      // Basic validation
      if (!phone || !message) {
        return {
          success: false,
          message: 'Phone and message are required',
          statusCode: HttpStatus.BAD_REQUEST,
        };
      }

      // Check rate limit
      this.checkRateLimit(phone);

      this.logger.log(`Sending delivery notification SMS to ${phone}`);

      let config = {
          method: 'get',
          maxBodyLength: Infinity,
          url: `https://api.messagepro.mn/send?from=${process.env.FROM_NUMBER || '72729979'}&to=${phone}&text=${message}`,
          headers: {
            'x-api-key': process.env.CALL_PRO_KEY || 'ffb999795b180e5ae29d0c96378f22a1'
          }
      };

      let result = [];
      axios.request(config)
      .then(async (response) => {
        console.log(JSON.stringify(response.data));
        result = response.data;

        // Save SMS record

        await this.prisma.sMS.create({
          data: {
            phoneNumber: phone,
            message: message,
            status: response.data[0].Result || 'sent',
          },
        });

        this.logger.log(
          `Delivery notification SMS sent successfully to ${phone}`,
        );

        return {
          success: true,
          message: 'Delivery notification SMS sent successfully',
          data: result,
          statusCode: HttpStatus.OK,
        };
      })
      .catch((error) => {
        console.log(error);
        throw error;
      });
    } catch (error) {
      this.logger.error(
        `Failed to send delivery notification SMS to ${phone}: ${error.message}`,
        error.stack,
      );

      // Save failed SMS record
      try {
        await this.prisma.sMS.create({
          data: {
            phoneNumber: phone,
            message: message,
            status: 'failed',
          },
        });
      } catch (dbError) {
        this.logger.error(
          `Failed to save notification SMS record: ${dbError.message}`,
        );
      }

      if (error.message.includes('Rate limit exceeded')) {
        return {
          success: false,
          message: error.message,
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
        };
      }

      return {
        success: false,
        message: 'Failed to send delivery notification SMS',
        error: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  // Get SMS history for a phone number
  async getSmsHistory(phoneNumber: string, limit: number = 10) {
    try {
      const smsRecords = await this.prisma.sMS.findMany({
        where: { phoneNumber },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return {
        success: true,
        data: smsRecords,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get SMS history for ${phoneNumber}: ${error.message}`,
      );

      return {
        success: false,
        message: 'Failed to get SMS history',
        error: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  // Get SMS statistics
  async getSmsStats() {
    try {
      const totalSms = await this.prisma.sMS.count();
      const sentSms = await this.prisma.sMS.count({
        where: { status: 'sent' },
      });
      const failedSms = await this.prisma.sMS.count({
        where: { status: 'failed' },
      });

      return {
        success: true,
        data: {
          total: totalSms,
          sent: sentSms,
          failed: failedSms,
          successRate:
            totalSms > 0 ? ((sentSms / totalSms) * 100).toFixed(2) : '0.00',
        },
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(`Failed to get SMS stats: ${error.message}`);

      return {
        success: false,
        message: 'Failed to get SMS statistics',
        error: error.message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
