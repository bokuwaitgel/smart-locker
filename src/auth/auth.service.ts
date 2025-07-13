import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

    // create superuser
  async createSuperUser(email: string, password: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message: 'Superuser already exists',
      };
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        password, // Ensure to hash the password in a real application
        role: 'SUPERUSER',
      },
    });

    return {
      success: true,
      message: 'Superuser created successfully',
      data: user,
    };
  }

    async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
        where: { email },
        });
    
        if (!user || user.password !== password) {
        return null; // In a real application, you should hash the password and compare
        }
    
        return user;
    }

    async updateUser(id: number, data: any) {
        return this.prisma.user.update({ where: { id }, data });
    }


}
 