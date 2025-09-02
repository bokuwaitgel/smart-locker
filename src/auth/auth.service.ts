import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // login
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.password !== password) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    return {
      success: true,
      message: 'Login successful',
      data: user,
    };
  }

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
        role: UserRole.ADMIN,
      },
    });

    return {
      success: true,
      message: 'Superuser created successfully',
      data: user,
    };
  }

  async validateUser(data:  {email: string}) {
        const user = await this.prisma.user.findUnique({
        where: { email: data.email },
        });

        if (!user) {
          return null;
        }

        return user;
    }

  async updateUser(id: number, data: any) {
        return this.prisma.user.update({ where: { id }, data });
  }


}
 