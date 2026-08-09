import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ok } from '../common/response';

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create sale (cash / credit / partial)',
    description:
      'Atomic: sale + items + cost snapshot + profit + ledger. Cash IN only when paidAmount > 0 and paymentMethod is CASH.',
  })
  async create(
    @Body() dto: CreateSaleDto,
    @CurrentUser() user: { id: string },
  ) {
    return ok(await this.salesService.create(dto, user.id), 'Sale saved');
  }

  @Get()
  @ApiOperation({ summary: 'List sales' })
  async list() {
    return ok(await this.salesService.findAll());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale by id' })
  async get(@Param('id') id: string) {
    return ok(await this.salesService.findOne(id));
  }
}
