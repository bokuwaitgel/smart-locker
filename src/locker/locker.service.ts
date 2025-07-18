import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateLockerDto, UpdateLockerDto } from './dto';

@Injectable()
export class LockerService {
  constructor(private prisma: PrismaService) {}

  // Add methods for locker management here
  async createLocker(data: CreateLockerDto) {
    const result = await this.prisma.locker.create({
      data: {
        lockerNumber: data.lockerNumber,
        description: data.description,
        status: 'PENDING',
        Container: {
          connect: { id: Number(data.containerId) },
        },
      },
    });

    if (!result) {
      return {
        success: false,
        type: 'error',
        message: 'Failed to create locker',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    return {
      success: true,
      type: 'success',
      message: 'Locker created successfully',
      statusCode: HttpStatus.CREATED,
      data: result,
    };

  }

  async updateLocker(id: number, data: any) {
    return this.prisma.locker.update({ where: { id }, data });
  }

  async deleteLocker(id: number) {
    const locker = await this.prisma.locker.findUnique({ where: { id } });
    if (!locker) {
      return {
        success: false,
        type: 'error',
        message: 'Locker not found',
        statusCode: HttpStatus.NOT_FOUND,
      };
    }

    await this.prisma.locker.delete({ where: { id } });

    return {
      success: true,
      type: 'success',
      message: 'Locker deleted successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async getStatus(lockerNumber?: string) {
    if (lockerNumber) {
      const locker = await this.prisma.locker.findUnique({ where: { 'lockerNumber': lockerNumber } });
      if (!locker) {
        return {
          success: false,
          type: 'error',
          message: 'Locker not found',
          statusCode: HttpStatus.NOT_FOUND,
        };
      }
      return {
        success: true,
        type: 'success',
        message: 'Locker status retrieved successfully',
        statusCode: HttpStatus.OK,
        data: locker.status,
      };
    }

    const lockers = await this.prisma.locker.findMany();
    return {
      success: true,
      type: 'success',
      message: 'All lockers status retrieved successfully',
      statusCode: HttpStatus.OK,
      data: lockers.map(locker => ({ id: locker.id, status: locker.status })),
    };
  }
}
