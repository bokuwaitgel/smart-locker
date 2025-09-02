import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


import { CreateContainerDto, UpdateContainerDto } from './dto';

@Injectable()
export class ContainerService {
  constructor(private prisma: PrismaService) {}

  async createContainer(data: CreateContainerDto) {
    const result = await this.prisma.container.create({
        data: {
            boardId: data.boardId,
            location: data.location,
            description: data.description,
            },
    });

    if (!result) {
        return {
            success: false,
            type: 'error',
            message: 'Failed to create container',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        }
    }

    return {
        success: true,
        type: 'success',
        message: 'Container created successfully',
        statusCode: HttpStatus.CREATED,
        data: result,
    };
  }

  async getAllContainers() {
    const containers = await this.prisma.container.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      type: 'success',
      message: 'Containers retrieved successfully',
      statusCode: HttpStatus.OK,
      data: containers,
    };
  }

  async getContainerById(id: number) {
    console.log('Fetching container with ID:', id);
    const container = await this.prisma.container.findUnique({
      where: { id: Number(id) },
    });

    if (!container) {
      return {
        success: false,
        type: 'error',
        message: 'Container not found',
        statusCode: HttpStatus.NOT_FOUND,
      };
    }

    return {
      success: true,
      type: 'success',
      message: 'Container retrieved successfully',
      statusCode: HttpStatus.OK,
      data: container,
    };
  }

  async updateContainer(id: number, data: UpdateContainerDto) {
    const result = await this.prisma.container.update({
      where: { id: Number(id) },
      data,
    });

    if (!result) {
      return {
        success: false,
        type: 'error',
        message: 'Failed to update container',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    return {
      success: true,
      type: 'success',
      message: 'Container updated successfully',
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  async deleteContainer(id: number) {
    const result = await this.prisma.container.delete({ where: { id } });

    if (!result) {
      return {
        success: false,
        type: 'error',
        message: 'Failed to delete container',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    return {
      success: true,
      type: 'success',
      message: 'Container deleted successfully',
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  async getAllLockersInContainer(boardId: string) {
    const container = await this.prisma.container.findUnique({
      where: { boardId },
      include: { Lockers: true },
    }); 


    if (!container) {
      return {
        success: false,
        type: 'error',
        message: 'Container not found',
        statusCode: HttpStatus.NOT_FOUND,
      };
    }

    const lockers = container.Lockers;


    return {
      success: true,
      type: 'success',
      message: 'Lockers retrieved successfully',
      statusCode: HttpStatus.OK,
      data: lockers,
    };
  }

}
