import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  UserProfileDto,
} from './user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    return this.authService.login(email, password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: any): Promise<UserProfileDto> {
    return this.authService.getProfile(req.user.id);
  }

  @Post('create-superuser')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a superuser (admin only or setup)' })
  @ApiResponse({
    status: 201,
    description: 'Superuser created successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createSuperUser(
    @Body() body: { email: string; password: string },
  ): Promise<AuthResponseDto> {
    const { email, password } = body;
    return this.authService.createSuperUser(email, password);
  }
}
