import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  phoneNumber?: string;
}

export class AuthResponseDto {
  success: boolean;
  message: string;
  data?: any;
  token?: string;
}

export class UserProfileDto {
  id: number;
  email: string;
  name?: string;
  phoneNumber?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
