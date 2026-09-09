import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Redis } from 'ioredis';
import { Product } from './product.entity.js';
import { User } from '../users/user.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { REDIS_CLIENT } from '../redis/redis.constants.js';

const CACHE_KEY = 'products:all';
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
    await this.redis.del(CACHE_KEY);
    return product;
  }

  async findAll(): Promise<Product[]> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as Product[];
    }

    const products = await this.products.find({
      order: { createdAt: 'DESC' },
    });
    await this.redis.set(
      CACHE_KEY,
      JSON.stringify(products),
      'EX',
      CACHE_TTL_SECONDS,
    );
    return products;
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.products.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    const saved = await this.products.save(product);
    await this.redis.del(CACHE_KEY);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const result = await this.products.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    await this.redis.del(CACHE_KEY);
  }
}
