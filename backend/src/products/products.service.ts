import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Redis } from 'ioredis';
import { Product } from './product.entity.js';
import { User } from '../users/user.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ListProductsDto } from './dto/list-products.dto.js';
import type { PaginatedProducts } from './dto/paginated-products.dto.js';
import { REDIS_CLIENT } from '../redis/redis.constants.js';

const CACHE_PREFIX = 'products:page:';
const CACHE_TTL_SECONDS = 15;

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async create(dto: CreateProductDto, ownerId: string): Promise<Product> {
    const product = await this.products.save(
      this.products.create({ ...dto, owner: { id: ownerId } as User }),
    );
    await this.invalidateCache();
    return product;
  }

  async findAll({ page, limit }: ListProductsDto): Promise<PaginatedProducts> {
    const cacheKey = `${CACHE_PREFIX}${page}:${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as PaginatedProducts;
    }

    const [items, total] = await this.products.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const result: PaginatedProducts = {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };

    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      'EX',
      CACHE_TTL_SECONDS,
    );
    return result;
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.products.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    userId: string,
  ): Promise<Product> {
    const product = await this.findOne(id);
    this.assertOwnership(product, userId);

    Object.assign(product, dto);
    const saved = await this.products.save(product);
    await this.invalidateCache();
    return saved;
  }

  async remove(id: string, userId: string): Promise<void> {
    const product = await this.findOne(id);
    this.assertOwnership(product, userId);

    await this.products.delete(id);
    await this.invalidateCache();
  }

  private assertOwnership(product: Product, userId: string): void {
    if (product.owner && product.owner.id !== userId) {
      throw new ForbiddenException('You do not own this product');
    }
  }

  private async invalidateCache(): Promise<void> {
    const keys = await this.redis.keys(`${CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
