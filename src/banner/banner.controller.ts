import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BannerService } from './banner.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('banner')
export class BannerController {
    constructor(private readonly bannerService: BannerService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
     @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiTags('Banner')
    @ApiOperation({ summary: 'Create a new banner' })
    @ApiResponse({ status: 201, description: 'The banner has been created.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @HttpCode(HttpStatus.CREATED)
    async createBanner(
        @Body('type') type: string,
        @Body('file') file: any,
    ): Promise<void> {
        return this.bannerService.createBanner(type, file);
    }

    @Get()
    @ApiTags('Banner')
    @ApiOperation({ summary: 'Get all active banners' })
    @ApiResponse({ status: 200, description: 'List of active banners.' })
    async getBanners(): Promise<any[]> {
        return this.bannerService.getBanners();
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiTags('Banner')
    @ApiOperation({ summary: 'Delete a banner' })
    @ApiResponse({ status: 204, description: 'The banner has been deleted.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteBanner(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.bannerService.deleteBanner(id);
    }
}
