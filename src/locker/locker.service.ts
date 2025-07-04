import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LockerService {
  constructor(private prisma: PrismaService) {}

  async getStatus(lockerId?: number) {
    if (lockerId) {
      return this.prisma.locker.findUnique({ where: { id: lockerId } });
    }
    return this.prisma.locker.findMany();
  }
}
