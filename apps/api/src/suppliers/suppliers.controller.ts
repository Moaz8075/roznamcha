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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ok } from '../common/response';

@ApiTags('suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create supplier' })
  async create(@Body() dto: CreateSupplierDto) {
    return ok(await this.suppliersService.create(dto), 'Supplier saved');
  }

  @Get()
  @ApiOperation({ summary: 'List suppliers (with derived balances)' })
  async list(@Query('q') q?: string) {
    return ok(await this.suppliersService.findAll(q));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by id' })
  async get(@Param('id') id: string) {
    return ok(await this.suppliersService.findOne(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update supplier' })
  async update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return ok(await this.suppliersService.update(id, dto), 'Supplier updated');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete supplier' })
  async remove(@Param('id') id: string) {
    return ok(await this.suppliersService.remove(id), 'Supplier deleted');
  }
}
