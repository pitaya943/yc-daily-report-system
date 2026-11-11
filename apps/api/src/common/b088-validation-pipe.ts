import { BadRequestException, ValidationPipe } from '@nestjs/common';

/** B-088 — class-validator failures return spec Chinese messages. */
export function createB088ValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      for (const e of errors) {
        if (e.constraints) {
          const msg = Object.values(e.constraints)[0];
          if (msg) return new BadRequestException(msg);
        }
      }
      return new BadRequestException('請求格式不正確');
    },
  });
}
