import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { json } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from '@shared/presentation/domain-exception.filter';
import { JsonContentTypeMiddleware } from '@shared/presentation/json-content-type.middleware';

export const createApp = async (): Promise<INestApplication> => {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  const contentTypeGuard = new JsonContentTypeMiddleware();
  app.use(contentTypeGuard.use.bind(contentTypeGuard));
  app.use(json({ limit: '10mb' }));
  app.useGlobalFilters(new DomainExceptionFilter());

  await app.init();
  return app;
};
