import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ok } from '../common/response';

@ApiTags('purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create purchase (cash / credit / partial)',
    description:
      'Atomic: purchase + items + supplier ledger. Cash OUT only when paidAmount > 0 and paymentMethod is CASH.',
  })
  async create(
    @Body() dto: CreatePurchaseDto,
    @CurrentUser() user: { id: string },
  ) {
    return ok(await this.purchasesService.create(dto, user.id), 'Purchase saved');
  }

  @Get()
  @ApiOperation({ summary: 'List purchases' })
  async list() {
    return ok(await this.purchasesService.findAll());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase by id' })
  async get(@Param('id') id: string) {
    return ok(await this.purchasesService.findOne(id));
  }
}
