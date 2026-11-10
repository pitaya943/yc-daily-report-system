import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { SessionAccount } from '../auth/types';

export const CurrentAccount = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionAccount => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.session.account!;
  },
);
