import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ok } from '../common/response';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create wood product (no stock tracking)' })
  async create(@Body() dto: CreateProductDto) {
    return ok(await this.productsService.create(dto), 'Product saved');
  }

  @Get()
  @ApiOperation({ summary: 'List products' })
  async list(@Query('q') q?: string) {
    return ok(await this.productsService.findAll(q));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  async get(@Param('id') id: string) {
    return ok(await this.productsService.findOne(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return ok(await this.productsService.update(id, dto), 'Product updated');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete product' })
  async remove(@Param('id') id: string) {
    return ok(await this.productsService.remove(id), 'Product deleted');
  }
}
