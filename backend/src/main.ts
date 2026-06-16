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

  // Enable CORS — CORS_ORIGIN is a comma-separated list of allowed origins.
  // Defaults cover local dev so first-time runs don't have to set anything.
  // We also strip surrounding quotes and trailing slashes per entry, because
  // copy-pasting an env var with `"..."` wrappers is a common Railway/.env footgun.
  const rawCors = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3002')
    .replace(/^["']|["']$/g, ''); // strip wrapping quotes around the whole value
  const corsOrigins = rawCors
    .split(',')
    .map((o) =>
      o
        .trim()
        .replace(/^["']|["']$/g, '') // strip wrapping quotes around each entry
        .replace(/\/$/, ''),         // drop trailing slash
    )
    .filter(Boolean);

  console.log('CORS allowed origins:', corsOrigins);

  app.enableCors({
    origin: corsOrigins,
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
