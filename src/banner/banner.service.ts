import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AwsS3Service } from 'src/s3.service';

@Injectable()
export class BannerService {
    private readonly logger = new Logger(BannerService.name);

    constructor(private prisma: PrismaService, private s3: AwsS3Service) {}

    async createBanner(type: string, file: any): Promise<any> {
        if (type === 'image') {
            this.logger.log(`Creating image banner: ${file.originalname}`);
            const imageUrl = await this.s3.uploadBannerImage(file);
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
            this.logger.log(`Creating video banner: ${file.originalname}`);
            const videoUrl = await this.s3.uploadbannerVideo(file);
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
        this.logger.log(`Updating banner id=${id}, status=${status}`);
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
            orderBy: { sortOrder: 'asc' },
        });
        return {
            status: true,
            message: 'Banners fetched successfully',
            data: data
        };
    }

    async deleteBanner(id: number): Promise<any> {
        this.logger.log(`Deleting banner id=${id}`);
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
