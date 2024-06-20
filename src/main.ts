import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import  * as cookieParser  from 'cookie-parser';
import Logging from './library/Logging';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    bufferLogs: true,
  })
  app.enableCors({
    origin: ['http://localhost:3000'],
    //origin: ['https://quotastic1.onrender.com'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe())
  app.use(cookieParser())
  const PORT = process.env.PORT || 8080
  await app.listen(PORT)

  Logging.log(`App is listening on: ${await app.getUrl()}`)
}
bootstrap();
