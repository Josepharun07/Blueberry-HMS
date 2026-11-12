import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CustomLoggerService } from './common/logging/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(CustomLoggerService);
  const config = app.get(ConfigService);
  app.useLogger(logger);

  logger.log('Starting API', 'Bootstrap');

  app.use(helmet());
  app.use(cookieParser());

  const origins = config.getOrThrow<string[]>('CORS_ORIGINS');
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalInterceptors(
    new LoggingInterceptor(logger),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix('api/v1');

  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Blueberry HMS API')
      .setDescription('Hotel management API. Session cookie plus CSRF header for browser clients.')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('bh_access')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = config.get<string>('API_PORT') ?? '4000';
  await app.listen(port);

  logger.log(`API listening on port ${port}`, 'Bootstrap');
}

bootstrap();
