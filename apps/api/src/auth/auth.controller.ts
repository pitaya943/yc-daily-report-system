import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  Session,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SessionAccount } from './types';
import { SignInDto } from './dto/sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('sign-in-names')
  async signInNames(
    @Query('type') type?: 'admin' | 'west' | 'south' | 'employee',
  ) {
    const signInType =
      type === 'west' || type === 'south' || type === 'employee'
        ? type
        : 'admin';
    const names = await this.auth.listSignInNames(signInType);
    return { names, type: signInType };
  }

  @Post('sign-in')
  async signIn(
    @Body() body: SignInDto,
    @Req() req: Request,
    @Session() session: Request['session'],
  ) {
    const clientAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const account = await this.auth.signIn({
      displayName: body.displayName,
      password: body.password,
      clientAddress,
    });
    session.account = account;
    session.lastActivityMs = Date.now();
    return { account: { displayName: account.displayName, role: account.role } };
  }

  @Post('sign-out')
  @UseGuards(AuthGuard)
  signOut(@Session() session: Request['session'], @Res() res: Response) {
    session.destroy(() => {
      res.clearCookie('yc_session');
      res.json({ ok: true });
    });
  }

  @Get('session')
  sessionInfo(@Session() session: Request['session']) {
    const account: SessionAccount | undefined = session.account;
    if (!account) {
      return { signedIn: false };
    }
    return { signedIn: true, account };
  }
}
