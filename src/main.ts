import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import * as express from 'express';

const logger = new Logger('Bootstrap');

// Catch fatal errors that would silently kill the process
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

async function bootstrap() {
  logger.log('⏳ Starting Smart Locker API...');

  const app = await NestFactory.create(AppModule);
  logger.log('✅ NestJS application created');

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ limit: '5mb', extended: true }));
  logger.log('✅ Body parser configured (5mb limit)');

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3031',
      'http://172.29.1.6:3031',
      'http://143.110.184.5:3000',
      'http://68.183.82.139:3000',
      'http://68.183.82.139:3031',
      'http://142.93.222.101:3000',
      'http://168.144.34.171:3000',
      'http://168.144.34.171:3030',
      'http://20.2.73.131:3031',
      'null',
      'file://',
    ],
    credentials: true,
  });
  logger.log('✅ CORS enabled');

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  logger.log('✅ Global pipes & filters registered');

  app.enableShutdownHooks();
  logger.log('✅ Graceful shutdown hooks enabled');

  const config = new DocumentBuilder()
    .setTitle('Smart Locker API')
    .setDescription('Delivery and pickup API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  logger.log('✅ Swagger docs configured');

  const port = process.env.PORT || 3030;
  await app.listen(port, '0.0.0.0');
  logger.log('=========================================');
  logger.log(`🚀 Server running on http://0.0.0.0:${port}`);
  logger.log(`📖 Swagger docs at http://0.0.0.0:${port}/api`);
  logger.log('=========================================');
}
bootstrap();
