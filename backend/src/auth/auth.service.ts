import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import type { Redis } from 'ioredis';
import { UsersService } from '../users/users.service.js';
import { User } from '../users/user.entity.js';
import { REDIS_CLIENT } from '../redis/redis.constants.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

const SESSION_PREFIX = 'session:';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type PublicUser = Pick<User, 'id' | 'name' | 'email'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ sessionId: string; user: PublicUser }> {
    const existing = await this.users.findByEmailWithPassword(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create(dto.name, dto.email, passwordHash);
    const sessionId = await this.createSession(user.id);
    return {
      sessionId,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ sessionId: string; user: PublicUser }> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const sessionId = await this.createSession(user.id);
    return {
      sessionId,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.redis.del(SESSION_PREFIX + sessionId);
  }

  async validateSession(sessionId: string): Promise<PublicUser> {
    const userId = await this.redis.get(SESSION_PREFIX + sessionId);
    if (!userId) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    return { id: user.id, name: user.name, email: user.email };
  }

  private async createSession(userId: string): Promise<string> {
    const sessionId = randomUUID();
    await this.redis.set(
      SESSION_PREFIX + sessionId,
      userId,
      'EX',
      SESSION_TTL_SECONDS,
    );
    return sessionId;
  }
}
