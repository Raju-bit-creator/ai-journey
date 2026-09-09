import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth.service.js';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.headers['x-session-id'];

    if (typeof sessionId !== 'string') {
      throw new UnauthorizedException('Missing session');
    }

    request.user = await this.auth.validateSession(sessionId);
    return true;
  }
}
