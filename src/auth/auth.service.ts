import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { RegisterDto, UserProfileDto } from './user.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // Validate password
  private async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  private generateToken(user: any): string {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return this.jwtService.sign(payload);
  }

  // Login
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user);

    return {
      success: true,
      message: 'Login successful',
      data: this.formatUserProfile(user),
      token,
    };
  }

  // Register new user
  async register(registerDto: RegisterDto) {
    const { email, password, name, phoneNumber } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message: 'User with this email already exists',
      };
    }

    // Check if phone number is already taken
    if (phoneNumber) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (existingPhone) {
        return {
          success: false,
          message: 'Phone number already in use',
        };
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phoneNumber,
        role: UserRole.USER,
      },
    });

    const token = this.generateToken(user);

    return {
      success: true,
      message: 'User registered successfully',
      data: this.formatUserProfile(user),
      token,
    };
  }

  // Create superuser (admin)
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

    const hashedPassword = await this.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: UserRole.ADMIN,
        name: 'Super Admin',
      },
    });

    return {
      success: true,
      message: 'Superuser created successfully',
      data: this.formatUserProfile(user),
    };
  }

  // Validate user for JWT strategy
  async validateUser(payload: { email: string; sub: number }) {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      return null;
    }

    return this.formatUserProfile(user);
  }

  // Get user profile
  async getProfile(userId: number): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.formatUserProfile(user);
  }

  // Update user
  async updateUser(id: number, data: Partial<RegisterDto>) {
    if (data.password) {
      data.password = await this.hashPassword(data.password);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    return {
      success: true,
      message: 'User updated successfully',
      data: this.formatUserProfile(user),
    };
  }

  // Format user profile (exclude password)
  private formatUserProfile(user: any): UserProfileDto {
    const { password, ...userProfile } = user;
    return userProfile;
  }
}
