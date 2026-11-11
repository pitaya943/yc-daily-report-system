import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { AppModule } from '../../src/app.module';
import { loadConfig } from '../../src/config';
import { createB088ValidationPipe } from '../../src/common/b088-validation-pipe';

export async function createTestApp(): Promise<INestApplication> {
  const config = loadConfig();
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.use(
    session({
      name: 'yc_session',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: { httpOnly: true, sameSite: 'lax', secure: false },
    }),
  );
  app.useGlobalPipes(createB088ValidationPipe());
  await app.init();
  return app;
}
