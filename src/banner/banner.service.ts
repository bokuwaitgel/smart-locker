import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AwsS3Service } from 'src/s3.service';

@Injectable()
export class BannerService {
    constructor(private prisma: PrismaService) {} 

    async createBanner(type: string, file: any): Promise<any> {
        const s3 = new AwsS3Service();
        if (type === 'image') {
            console.log('Creating image banner');
            const imageUrl = await s3.uploadBannerImage(file);
            const result = await this.prisma.banner.create({
                data: {
                    type,
                    url: imageUrl,
                    status: true,
                    sortOrder: 0,
                },
            });
            return {
                status: true,
                message: 'Banner created successfully',
                data:result
            }
        } else if (type === 'video') {
            const videoUrl = await s3.uploadbannerVideo(file);
            const result = await this.prisma.banner.create({
                data: {
                    type,
                    url: videoUrl,
                    status: true,
                    sortOrder: 0,
                },
            });

            return {
                status: true,
                message: 'Banner created successfully',
                data: result
            }
        }

    }

    async updateBanner(id: number, status: boolean): Promise<any> {
        const result = await this.prisma.banner.update({
            where: { id },
            data: { status },
        });
        return {
            status: true,
            message: 'Banner updated successfully',
            data: result
        };
    }

    async getBanners(): Promise<any> {
        const data = await this.prisma.banner.findMany({
            where: { status: true },
            orderBy: { sortOrder: 'asc' },
        });
        return {
            status: true,
            message: 'Banners fetched successfully',
            data: data
        };
    }

    async deleteBanner(id: number): Promise<any> {
       const banner = await this.prisma.banner.findUnique({
            where: { id },
        });
        if (!banner) {
            throw new Error('Banner not found');
        }
        await this.prisma.banner.delete({
            where: { id },
        });
        return {
            status: true,
            message: 'Banner deleted successfully',
        };
    }
}
