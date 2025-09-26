import { Body, Controller, Delete, Get, Post, Put, Param, UseInterceptors, UploadedFile, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';

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
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({ status: 201, description: 'The banner has been created.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @HttpCode(HttpStatus.CREATED)
    async createBanner(
        @Body() data: { type: string },
        @UploadedFile() file: Express.Multer.File,
    ): Promise<void> {
        return this.bannerService.createBanner(data.type, file);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiTags('Banner')
    @ApiOperation({ summary: 'Update banner status' })
    @ApiResponse({ status: 200, description: 'The banner has been updated.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    async updateBanner(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: { status: boolean },
    ): Promise<void> {
        return this.bannerService.updateBanner(id, data.status);
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
