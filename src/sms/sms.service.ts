// src/sms/sms.service.ts
import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private client: Twilio;


  constructor(private prisma: PrismaService) {
    this.client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

    async sendSMS(phone: string, message: string) {
    const result = await this.client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone.startsWith('+') ? phone : `+976${phone}` // For Mongolian numbers
    });
    await this.prisma.sMS.create({
      data: {
        phoneNumber: phone,
        message: message,
        status: result.status,
      },
    });
    if (!result) {
      return {
        success: false,
        message: 'Failed to send SMS',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
    return {
        success: true,
        message: 'SMS sent successfully',
        data: result,
        statusCode: HttpStatus.OK,
    };

  }


  async sendPickupCode(phone: string, lockerLocation: string, code: string) {
    const message = `Таны илгээмж бэлэн боллоо!\nБайршил: ${lockerLocation}\nКод: ${code}`;
    const result =  await this.client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone.startsWith('+') ? phone : `+976${phone}` // For Mongolian numbers
    });

    await this.prisma.sMS.create({
      data: {
        phoneNumber: phone,
        message: message,
        status: result.status,
      },
    });

    if (!result) {
      return {
        success: false,
        message: 'Failed to send SMS',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    return {
      success: true,
      message: 'SMS sent successfully',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  async sendDeliveryCode(phone: string, code: string) {
    const message = `Таны илгээмж бэлэн боллоо!\nКод: ${code}`;
    const result = await this.client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone.startsWith('+') ? phone : `+976${phone}` // For Mongolian numbers
    });

    await this.prisma.sMS.create({
      data: {
        phoneNumber: phone,
        message: message,
        status: result.status,
      },
    });

    if (!result) {
      return {
        success: false,
        message: 'Failed to send SMS',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    return {
      success: true,
      message: 'SMS sent successfully',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  async sendDeliveryNotification(phone: string, message: string) {
    const result = await this.client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone.startsWith('+') ? phone : `+976${phone}` // For Mongolian numbers
    });

    await this.prisma.sMS.create({
      data: {
        phoneNumber: phone,
        message: message,
        status: result.status,
      },
    });

    if (!result) {
      return {
        success: false,
        message: 'Failed to send SMS',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    return {
      success: true,
      message: 'SMS sent successfully',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }
}
