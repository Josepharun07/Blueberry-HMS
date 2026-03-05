import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet.default());
  
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://blueberryhillsmunnar.in', 'https://hms.blueberryhillsmunnar.in']
      : '*',
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  // Global serialization (respects @Exclude decorators)
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludeExtraneousValues: false,
      exposeUnsetFields: false,
    }),
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

  const config = new DocumentBuilder()
    .setTitle('Blueberry HMS API')
    .setDescription('Hotel Management Suite for Blueberry Hills Resort, Munnar')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication')
    .addTag('Property Management')
    .addTag('User Management')
    .addTag('Audit Logs')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 4000;
  await app.listen(port);
  
  console.log(`🚀 Blueberry HMS API running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🏨 Property: Blueberry Hills Resort, Munnar`);
  console.log(`🔒 Phase 2: Authentication & Authorization Active`);
}

bootstrap();
