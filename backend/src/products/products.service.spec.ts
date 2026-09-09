import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { Product } from './product.entity.js';
import { REDIS_CLIENT } from '../redis/redis.constants.js';

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findAndCount: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let redis: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
    keys: ReturnType<typeof vi.fn>;
  };

  const OWNER_ID = 'owner-1';
  const OTHER_USER_ID = 'user-2';

  beforeEach(async () => {
    repo = {
      create: vi.fn((dto) => dto),
      save: vi.fn(async (entity) => ({ id: 'product-1', ...entity })),
      findAndCount: vi.fn(),
      findOneBy: vi.fn(),
      delete: vi.fn(),
    };
    redis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      keys: vi.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: repo },
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  describe('create', () => {
    it('attaches the owner and invalidates the cache', async () => {
      const product = await service.create(
        { name: 'Widget', price: 9.99 } as any,
        OWNER_ID,
      );

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ owner: { id: OWNER_ID } }),
      );
      expect(product.id).toBe('product-1');
      expect(redis.keys).toHaveBeenCalledWith('products:page:*');
    });
  });

  describe('findAll', () => {
    it('returns cached results without querying the database', async () => {
      const cached = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(cached);
      expect(repo.findAndCount).not.toHaveBeenCalled();
    });

    it('queries the database and caches the result on a miss', async () => {
      redis.get.mockResolvedValue(null);
      repo.findAndCount.mockResolvedValue([[{ id: 'p1' }], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        items: [{ id: 'p1' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(redis.set).toHaveBeenCalledWith(
        'products:page:1:10',
        JSON.stringify(result),
        'EX',
        15,
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the product does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('rejects when the caller does not own the product', async () => {
      repo.findOneBy.mockResolvedValue({
        id: 'p1',
        owner: { id: OWNER_ID },
      });

      await expect(
        service.update('p1', { price: 1 } as any, OTHER_USER_ID),
      ).rejects.toThrow(ForbiddenException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('allows the owner to update and invalidates the cache', async () => {
      repo.findOneBy.mockResolvedValue({
        id: 'p1',
        price: 5,
        owner: { id: OWNER_ID },
      });

      await service.update('p1', { price: 10 } as any, OWNER_ID);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ price: 10 }),
      );
      expect(redis.keys).toHaveBeenCalled();
    });

    it('allows anyone to update an unowned (legacy) product', async () => {
      repo.findOneBy.mockResolvedValue({ id: 'p1', owner: null });

      await expect(
        service.update('p1', { price: 10 } as any, OTHER_USER_ID),
      ).resolves.toBeDefined();
    });
  });

  describe('remove', () => {
    it('rejects when the caller does not own the product', async () => {
      repo.findOneBy.mockResolvedValue({
        id: 'p1',
        owner: { id: OWNER_ID },
      });

      await expect(service.remove('p1', OTHER_USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('allows the owner to delete and invalidates the cache', async () => {
      repo.findOneBy.mockResolvedValue({
        id: 'p1',
        owner: { id: OWNER_ID },
      });

      await service.remove('p1', OWNER_ID);

      expect(repo.delete).toHaveBeenCalledWith('p1');
      expect(redis.keys).toHaveBeenCalled();
    });
  });
});
