import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContainerDto,
  UpdateContainerDto,
  ContainerResponseDto,
  ContainerStatsDto,
} from './dto';
import { ContainerStatus, UserRole } from '@prisma/client';

@Injectable()
export class ContainerService {
  constructor(private prisma: PrismaService) {}

  async createContainer(
    data: CreateContainerDto,
    userRole: UserRole = UserRole.USER,
  ): Promise<any> {
    // Check if user has permission to create containers
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can create containers');
    }

    // Check if boardId already exists
    const existingContainer = await this.prisma.container.findUnique({
      where: { boardId: data.boardId },
    });

    if (existingContainer) {
      throw new BadRequestException(
        'Container with this boardId already exists',
      );
    }

    try {
      const result = await this.prisma.container.create({
        data: {
          boardId: data.boardId,
          location: data.location,
          description: data.description,
          status: ContainerStatus.INACTIVE, // New containers start as inactive
        },
        include: {
          Lockers: true,
          _count: {
            select: { Lockers: true },
          },
        },
      });

      return {
        success: true,
        message: 'Container created successfully',
        data: this.formatContainerResponse(result),
      };
    } catch (error) {
      throw new BadRequestException('Failed to create container');
    }
  }

  async getAllContainers(userRole: UserRole = UserRole.USER): Promise<any> {
    try {
      const containers = await this.prisma.container.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          Lockers: true,
          _count: {
            select: { Lockers: true },
          },
        },
      });

      const formattedContainers = containers.map((container) =>
        this.formatContainerResponse(container),
      );

      return {
        success: true,
        message: 'Containers retrieved successfully',
        data: formattedContainers,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve containers');
    }
  }

  async getContainerById(id: number): Promise<any> {
    try {
      const container = await this.prisma.container.findUnique({
        where: { id },
        include: {
          Lockers: true,
          _count: {
            select: { Lockers: true },
          },
        },
      });

      if (!container) {
        throw new NotFoundException('Container not found');
      }

      return {
        success: true,
        message: 'Container retrieved successfully',
        data: this.formatContainerResponse(container),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve container');
    }
  }

  async getContainerByBoardId(boardId: string): Promise<any> {
    try {
      const container = await this.prisma.container.findUnique({
        where: { boardId },
        include: {
          Lockers: true,
          _count: {
            select: { Lockers: true },
          },
        },
      });

      if (!container) {
        throw new NotFoundException('Container not found');
      }

      return {
        success: true,
        message: 'Container retrieved successfully',
        data: this.formatContainerResponse(container),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve container');
    }
  }

  async updateContainer(
    id: number,
    data: UpdateContainerDto,
    userRole: UserRole = UserRole.USER,
  ): Promise<any> {
    // Check if user has permission to update containers
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can update containers');
    }

    try {
      // Check if container exists
      const existingContainer = await this.prisma.container.findUnique({
        where: { id },
      });

      if (!existingContainer) {
        throw new NotFoundException('Container not found');
      }

      const result = await this.prisma.container.update({
        where: { id },
        data,
        include: {
          Lockers: true,
          _count: {
            select: { Lockers: true },
          },
        },
      });

      return {
        success: true,
        message: 'Container updated successfully',
        data: this.formatContainerResponse(result),
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update container');
    }
  }

  async deleteContainer(
    id: number,
    userRole: UserRole = UserRole.USER,
  ): Promise<any> {
    // Check if user has permission to delete containers
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete containers');
    }

    try {
      // Check if container exists and has no active lockers
      const container = await this.prisma.container.findUnique({
        where: { id },
        include: {
          Lockers: {
            where: {
              status: {
                not: 'PENDING',
              },
            },
          },
        },
      });

      if (!container) {
        throw new NotFoundException('Container not found');
      }

      // Prevent deletion if container has active lockers
      if (container.Lockers.length > 0) {
        throw new BadRequestException(
          'Cannot delete container with active lockers',
        );
      }

      await this.prisma.container.delete({ where: { id } });

      return {
        success: true,
        message: 'Container deleted successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to delete container');
    }
  }

  async getAllLockersInContainer(boardId: string): Promise<any> {
    try {
      const container = await this.prisma.container.findUnique({
        where: { boardId },
        include: {
          Lockers: {
            orderBy: { lockerNumber: 'asc' },
          },
        },
      });

      if (!container) {
        throw new NotFoundException('Container not found');
      }

      return {
        success: true,
        message: 'Lockers retrieved successfully',
        data: {
          container: this.formatContainerResponse(container),
          lockers: container.Lockers,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve lockers');
    }
  }

  async updateContainerStatus(
    id: number,
    status: ContainerStatus,
    userRole: UserRole = UserRole.USER,
  ): Promise<any> {
    // Check if user has permission to update container status
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can update container status',
      );
    }

    try {
      const result = await this.prisma.container.update({
        where: { id },
        data: { status },
        include: {
          Lockers: true,
          _count: {
            select: { Lockers: true },
          },
        },
      });

      return {
        success: true,
        message: `Container status updated to ${status}`,
        data: this.formatContainerResponse(result),
      };
    } catch (error) {
      throw new BadRequestException('Failed to update container status');
    }
  }

  async getContainerStats(): Promise<ContainerStatsDto> {
    try {
      const [
        totalContainers,
        activeContainers,
        inactiveContainers,
        maintenanceContainers,
        totalLockers,
      ] = await Promise.all([
        this.prisma.container.count(),
        this.prisma.container.count({
          where: { status: ContainerStatus.ACTIVE },
        }),
        this.prisma.container.count({
          where: { status: ContainerStatus.INACTIVE },
        }),
        this.prisma.container.count({
          where: { status: ContainerStatus.MAINTENANCE },
        }),
        this.prisma.locker.count(),
      ]);

      return {
        totalContainers,
        activeContainers,
        inactiveContainers,
        maintenanceContainers,
        totalLockers,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve container statistics');
    }
  }

  private formatContainerResponse(container: any): ContainerResponseDto {
    const { _count, ...containerData } = container;
    return {
      ...containerData,
      lockerCount: _count?.Lockers || 0,
    };
  }
}
