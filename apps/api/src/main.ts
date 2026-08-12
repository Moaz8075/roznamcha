import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new PrismaExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Do NOT enable implicit conversion: money fields are strings ("200.00").
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((err) => {
          const own = Object.values(err.constraints ?? {});
          const nested = (err.children ?? []).flatMap((child) =>
            Object.values(child.constraints ?? {}),
          );
          return [...own, ...nested];
        });
        return new BadRequestException(messages[0] ?? 'Invalid request');
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Roznamcha API')
    .setDescription('Business accounting & ledger API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.API_PORT || process.env.PORT || 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`API running on http://0.0.0.0:${port}`);
  console.log(`Swagger: http://0.0.0.0:${port}/api/docs`);
}

bootstrap();
