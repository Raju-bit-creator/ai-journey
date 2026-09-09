import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { PublicUser } from '../auth.service.js';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): PublicUser => {
    return ctx.switchToHttp().getRequest<Request>().user!;
  },
);
