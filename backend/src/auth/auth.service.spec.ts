import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { REDIS_CLIENT } from '../redis/redis.constants.js';

describe('AuthService', () => {
  let service: AuthService;
  let users: {
    findByEmailWithPassword: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let redis: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    users = {
      findByEmailWithPassword: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    };
    redis = { get: vi.fn(), set: vi.fn(), del: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('rejects a duplicate email', async () => {
      users.findByEmailWithPassword.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          name: 'A',
          email: 'a@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
      expect(users.create).not.toHaveBeenCalled();
    });

    it('hashes the password and creates a session for a new user', async () => {
      users.findByEmailWithPassword.mockResolvedValue(null);
      users.create.mockImplementation(async (name, email, passwordHash) => ({
        id: 'user-1',
        name,
        email,
        passwordHash,
      }));

      const result = await service.register({
        name: 'Ada',
        email: 'ada@example.com',
        password: 'password123',
      });

      const [, , storedHash] = users.create.mock.calls[0];
      expect(storedHash).not.toBe('password123');
      expect(await bcrypt.compare('password123', storedHash)).toBe(true);

      expect(redis.set).toHaveBeenCalledWith(
        `session:${result.sessionId}`,
        'user-1',
        'EX',
        60 * 60 * 24 * 7,
      );
      expect(result.user).toEqual({
        id: 'user-1',
        name: 'Ada',
        email: 'ada@example.com',
      });
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      users.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nope@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      users.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        name: 'Ada',
        email: 'ada@example.com',
        passwordHash: await bcrypt.hash('correct-password', 10),
      });

      await expect(
        service.login({ email: 'ada@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('creates a session for correct credentials', async () => {
      users.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        name: 'Ada',
        email: 'ada@example.com',
        passwordHash: await bcrypt.hash('correct-password', 10),
      });

      const result = await service.login({
        email: 'ada@example.com',
        password: 'correct-password',
      });

      expect(result.sessionId).toBeDefined();
      expect(redis.set).toHaveBeenCalledWith(
        `session:${result.sessionId}`,
        'user-1',
        'EX',
        60 * 60 * 24 * 7,
      );
    });
  });

  describe('logout', () => {
    it('deletes the session key', async () => {
      await service.logout('some-session-id');
      expect(redis.del).toHaveBeenCalledWith('session:some-session-id');
    });
  });

  describe('validateSession', () => {
    it('rejects when the session key is missing', async () => {
      redis.get.mockResolvedValue(null);
      await expect(service.validateSession('missing')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects when the session points at a deleted user', async () => {
      redis.get.mockResolvedValue('user-1');
      users.findById.mockResolvedValue(null);

      await expect(service.validateSession('sid')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns the public user for a valid session', async () => {
      redis.get.mockResolvedValue('user-1');
      users.findById.mockResolvedValue({
        id: 'user-1',
        name: 'Ada',
        email: 'ada@example.com',
      });

      const user = await service.validateSession('sid');
      expect(user).toEqual({
        id: 'user-1',
        name: 'Ada',
        email: 'ada@example.com',
      });
    });
  });
});
