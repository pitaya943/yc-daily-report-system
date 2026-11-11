import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { loadConfig } from './config';
import { assertSafeBootstrapEnv } from './bootstrap-env';
import { createB088ValidationPipe } from './common/b088-validation-pipe';

async function bootstrap() {
  assertSafeBootstrapEnv();
  const config = loadConfig();
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(
    session({
      name: 'yc_session',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: config.sessionIdleMinutes * 60 * 1000,
      },
    }),
  );
  app.useGlobalPipes(createB088ValidationPipe());
  app.enableCors({
    origin: config.webOrigin,
    credentials: true,
  });
  await app.listen(config.port);
}

void bootstrap();
