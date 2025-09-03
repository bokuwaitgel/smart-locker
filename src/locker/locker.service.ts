import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLockerDto, UpdateLockerDto, LockerResponseDto, LockerStatsDto, BulkUpdateLockersDto } from './dto';
import { LockerStatus, UserRole } from '@prisma/client';

@Injectable()
export class LockerService {
  constructor(private prisma: PrismaService) {}

  async createLocker(data: CreateLockerDto, userRole: UserRole = UserRole.USER): Promise<any> {
    // Check if user has permission to create lockers
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can create lockers');
    }

    try {
      // Check if container exists
      const container = await this.prisma.container.findUnique({
        where: { boardId: data.boardId },
      });

      if (!container) {
        throw new NotFoundException('Container not found');
      }

      // Check if locker number already exists in this container
      const existingLocker = await this.prisma.locker.findFirst({
        where: {
          lockerNumber: data.lockerNumber,
          boardId: data.boardId,
        },
      });

      if (existingLocker) {
        throw new BadRequestException('Locker number already exists in this container');
      }

      const result = await this.prisma.locker.create({
        data: {
          lockerNumber: data.lockerNumber,
          description: data.description,
          status: LockerStatus.PENDING,
          boardId: data.boardId,
        },
        include: {
          Container: true,
        },
      });

      return {
        success: true,
        message: 'Locker created successfully',
        data: this.formatLockerResponse(result),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create locker');
    }
  }

  async getAllLockers(userRole: UserRole = UserRole.USER): Promise<any> {
    try {
      const lockers = await this.prisma.locker.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          Container: true,
        },
      });

      const formattedLockers = lockers.map(locker => this.formatLockerResponse(locker));

      return {
        success: true,
        message: 'Lockers retrieved successfully',
        data: formattedLockers,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve lockers');
    }
  }

  async getLockerById(id: number): Promise<any> {
    try {
      const locker = await this.prisma.locker.findUnique({
        where: { id },
        include: {
          Container: true,
        },
      });

      if (!locker) {
        throw new NotFoundException('Locker not found');
      }

      return {
        success: true,
        message: 'Locker retrieved successfully',
        data: this.formatLockerResponse(locker),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve locker');
    }
  }

  async getLockerByNumber(lockerNumber: string, boardId?: string): Promise<any> {
    try {
      const whereClause: any = { lockerNumber };
      if (boardId) {
        whereClause.boardId = boardId;
      }

      const locker = await this.prisma.locker.findFirst({
        where: whereClause,
        include: {
          Container: true,
        },
      });

      if (!locker) {
        throw new NotFoundException('Locker not found');
      }

      return {
        success: true,
        message: 'Locker retrieved successfully',
        data: this.formatLockerResponse(locker),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve locker');
    }
  }

  async updateLocker(id: number, data: UpdateLockerDto, userRole: UserRole = UserRole.USER): Promise<any> {
    // Check if user has permission to update lockers
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can update lockers');
    }

    try {
      // Check if locker exists
      const existingLocker = await this.prisma.locker.findUnique({
        where: { id },
      });

      if (!existingLocker) {
        throw new NotFoundException('Locker not found');
      }

      const result = await this.prisma.locker.update({
        where: { id },
        data,
        include: {
          Container: true,
        },
      });

      return {
        success: true,
        message: 'Locker updated successfully',
        data: this.formatLockerResponse(result),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to update locker');
    }
  }

  async updateLockerStatus(id: number, status: LockerStatus, userRole: UserRole = UserRole.USER): Promise<any> {
    // Check if user has permission to update locker status
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can update locker status');
    }

    try {
      const result = await this.prisma.locker.update({
        where: { id },
        data: { status },
        include: {
          Container: true,
        },
      });

      return {
        success: true,
        message: `Locker status updated to ${status}`,
        data: this.formatLockerResponse(result),
      };
    } catch (error) {
      throw new BadRequestException('Failed to update locker status');
    }
  }

  async bulkUpdateLockers(data: BulkUpdateLockersDto, userRole: UserRole = UserRole.USER): Promise<any> {
    // Check if user has permission to bulk update lockers
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can bulk update lockers');
    }

    try {
      const result = await this.prisma.locker.updateMany({
        where: {
          id: {
            in: data.lockerIds,
          },
        },
        data: {
          status: data.status,
        },
      });

      return {
        success: true,
        message: `Successfully updated ${result.count} lockers to ${data.status}`,
        data: {
          updatedCount: result.count,
          newStatus: data.status,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to bulk update lockers');
    }
  }

  async deleteLocker(id: number, userRole: UserRole = UserRole.USER): Promise<any> {
    // Check if user has permission to delete lockers
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete lockers');
    }

    try {
      // Check if locker exists
      const locker = await this.prisma.locker.findUnique({
        where: { id },
        include: {
          Container: true,
        },
      });

      if (!locker) {
        throw new NotFoundException('Locker not found');
      }

      // Prevent deletion if locker is occupied
      if (locker.status === LockerStatus.OCCUPIED) {
        throw new BadRequestException('Cannot delete an occupied locker');
      }

      await this.prisma.locker.delete({ where: { id } });

      return {
        success: true,
        message: 'Locker deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete locker');
    }
  }

  async getLockersByContainer(boardId: string): Promise<any> {
    try {
      const lockers = await this.prisma.locker.findMany({
        where: { boardId },
        orderBy: { lockerNumber: 'asc' },
        include: {
          Container: true,
        },
      });

      const formattedLockers = lockers.map(locker => this.formatLockerResponse(locker));

      return {
        success: true,
        message: 'Lockers retrieved successfully',
        data: {
          containerId: boardId,
          lockers: formattedLockers,
          totalCount: formattedLockers.length,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve lockers');
    }
  }

  async getAvailableLockers(boardId?: string): Promise<any> {
    try {
      const whereClause: any = { status: LockerStatus.AVAILABLE };
      if (boardId) {
        whereClause.boardId = boardId;
      }

      const lockers = await this.prisma.locker.findMany({
        where: whereClause,
        orderBy: { lockerNumber: 'asc' },
        include: {
          Container: true,
        },
      });

      const formattedLockers = lockers.map(locker => this.formatLockerResponse(locker));

      return {
        success: true,
        message: 'Available lockers retrieved successfully',
        data: formattedLockers,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve available lockers');
    }
  }

  async getLockerStats(): Promise<LockerStatsDto> {
    try {
      const [
        totalLockers,
        availableLockers,
        occupiedLockers,
        pendingLockers,
        maintenanceLockers,
      ] = await Promise.all([
        this.prisma.locker.count(),
        this.prisma.locker.count({ where: { status: LockerStatus.AVAILABLE } }),
        this.prisma.locker.count({ where: { status: LockerStatus.OCCUPIED } }),
        this.prisma.locker.count({ where: { status: LockerStatus.PENDING } }),
        this.prisma.locker.count({ where: { status: LockerStatus.MAINTENANCE } }),
      ]);

      return {
        totalLockers,
        availableLockers,
        occupiedLockers,
        pendingLockers,
        maintenanceLockers,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve locker statistics');
    }
  }

  async getLockerStatus(lockerNumber: string, boardId?: string): Promise<any> {
    try {
      const whereClause: any = { lockerNumber };
      if (boardId) {
        whereClause.boardId = boardId;
      }

      const locker = await this.prisma.locker.findFirst({
        where: whereClause,
        include: {
          Container: true,
        },
      });

      if (!locker) {
        throw new NotFoundException('Locker not found');
      }

      return {
        success: true,
        message: 'Locker status retrieved successfully',
        data: {
          lockerNumber: locker.lockerNumber,
          status: locker.status,
          boardId: locker.boardId,
          containerLocation: locker.Container?.location,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve locker status');
    }
  }

  private formatLockerResponse(locker: any): LockerResponseDto {
    const { Container, ...lockerData } = locker;
    return {
      ...lockerData,
      container: Container,
    };
  }
}