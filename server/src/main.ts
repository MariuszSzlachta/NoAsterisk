import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';
import helmet from 'helmet';
import { DomainExceptionFilter } from '@shared/presentation/domain-exception.filter';
import { JsonContentTypeMiddleware } from '@shared/presentation/json-content-type.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API prefix — frontend expects /api/*
  app.setGlobalPrefix('api');

  // Security headers (OWASP recommended)
  app.use(helmet());

  // CORS — restrict to known origins
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // Reject non-JSON content types on body-carrying requests
  const contentTypeGuard = new JsonContentTypeMiddleware();
  app.use(contentTypeGuard.use.bind(contentTypeGuard));

  app.use(json({ limit: '10mb' }));
  app.useGlobalFilters(new DomainExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
