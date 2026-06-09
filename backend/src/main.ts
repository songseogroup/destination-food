import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { getConnectionToken } from '@nestjs/typeorm';
import { json } from 'express';
import { AppModule } from './app.module';
import { seedDatabase } from './database/seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for Stripe webhooks
  });

  // Enable CORS
  app.enableCors({
    origin: [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      'http://localhost:3002', // CMS Admin
      'http://localhost:3000', // Main Project
      'https://dashboard-byfoods.vercel.app', // ✅ trailing slash hatao
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ByFoods CMS API')
    .setDescription('Content Management System API for ByFoods platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Seed database on startup
  try {
    // Wait a bit for the database connection to be fully established
    await new Promise(resolve => setTimeout(resolve, 1000));
    const dataSource = app.get(getConnectionToken());
    await seedDatabase(dataSource);
  } catch (error) {
    console.log('Database seeding skipped or failed:', error.message);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 ByFoods CMS API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔐 Default Admin: admin@byfoods.com / admin123`);
}

bootstrap();
