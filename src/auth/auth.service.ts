import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { RegisterDto, UserProfileDto } from './user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
    this.logger.log(`Login attempt for: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(`Login failed - user not found: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      this.logger.warn(`Login failed - invalid password: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user);
    this.logger.log(`Login successful: ${email} (role: ${user.role})`);

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
    this.logger.log(`Registration attempt: ${email}`);

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn(`Registration failed - email exists: ${email}`);
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
        this.logger.warn(`Registration failed - phone exists: ${phoneNumber}`);
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
    this.logger.log(`User registered successfully: ${email} (id: ${user.id})`);

    return {
      success: true,
      message: 'User registered successfully',
      data: this.formatUserProfile(user),
      token,
    };
  }

  // Create superuser (admin)
  async createSuperUser(email: string, password: string) {
    this.logger.log(`Creating superuser: ${email}`);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn(`Superuser already exists: ${email}`);
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

    this.logger.log(`Superuser created: ${email} (id: ${user.id})`);

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
