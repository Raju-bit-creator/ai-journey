import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ListProductsDto } from './dto/list-products.dto.js';
import type { PaginatedProducts } from './dto/paginated-products.dto.js';
import { Product } from './product.entity.js';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { PublicUser } from '../auth/auth.service.js';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @UseGuards(SessionAuthGuard)
  @ApiHeader({ name: 'x-session-id', required: true })
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: PublicUser,
  ): Promise<Product> {
    return this.products.create(dto, user.id);
  }

  @Get()
  findAll(@Query() query: ListProductsDto): Promise<PaginatedProducts> {
    return this.products.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Product> {
    return this.products.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard)
  @ApiHeader({ name: 'x-session-id', required: true })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: PublicUser,
  ): Promise<Product> {
    return this.products.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiHeader({ name: 'x-session-id', required: true })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: PublicUser,
  ): Promise<void> {
    return this.products.remove(id, user.id);
  }
}
