import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Redis } from 'ioredis';
import { Product } from './product.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
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

  async create(dto: CreateProductDto): Promise<Product> {
    const product = await this.products.save(this.products.create(dto));
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
}
