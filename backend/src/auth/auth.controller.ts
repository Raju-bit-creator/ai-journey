import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { AuthService, type PublicUser } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { SessionAuthGuard } from './guards/session-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(
    @Body() dto: RegisterDto,
  ): Promise<{ sessionId: string; user: PublicUser }> {
    return this.auth.register(dto);
  }

  @Post('login')
  login(
    @Body() dto: LoginDto,
  ): Promise<{ sessionId: string; user: PublicUser }> {
    return this.auth.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiHeader({ name: 'x-session-id', required: false })
  async logout(@Headers('x-session-id') sessionId?: string): Promise<void> {
    if (sessionId) {
      await this.auth.logout(sessionId);
    }
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiHeader({ name: 'x-session-id', required: true })
  me(@CurrentUser() user: PublicUser): PublicUser {
    return user;
  }
}
