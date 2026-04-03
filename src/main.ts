import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';

//cors
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Limit request body size to prevent memory exhaustion
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ limit: '5mb', extended: true }));

  app.enableCors({
    origin: [
      'http://localhost:3031',
      "http://localhost:3000",
      'http://172.29.1.6:3031',
      'http://143.110.184.5:3000', // Allow all subdomains of http:// for testing
      'http://20.2.73.131:3031',
      'null', // Allow local file access for testing
      'file://', // Allow file:// protocol for local HTML files
    ],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  // Enable graceful shutdown so Prisma $disconnect and cleanup hooks run
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Smart Locker API')
    .setDescription('Delivery and pickup API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3030);
}
bootstrap();
