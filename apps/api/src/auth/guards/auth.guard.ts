import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { loadConfig } from '../../config';

/** B-079 — 30-minute idle session; no remember-me extension. */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const account = req.session?.account;
    if (!account) {
      throw new UnauthorizedException();
    }
    const cfg = loadConfig();
    const idleMs = cfg.sessionIdleMinutes * 60 * 1000;
    const last = req.session.lastActivityMs ?? 0;
    const now = Date.now();
    if (now - last > idleMs) {
      req.session.destroy(() => undefined);
      throw new UnauthorizedException();
    }
    req.session.lastActivityMs = now;
    return true;
  }
}
