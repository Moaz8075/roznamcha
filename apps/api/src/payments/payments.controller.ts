import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ok } from '../common/response';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Receive customer money or pay supplier',
    description:
      'RECEIVE → customer ledger credit + cash IN (if CASH). PAY → supplier ledger credit + cash OUT (if CASH).',
  })
  async create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: { id: string },
  ) {
    return ok(await this.paymentsService.create(dto, user.id), 'Payment saved');
  }

  @Get()
  @ApiOperation({ summary: 'List payments' })
  async list() {
    return ok(await this.paymentsService.findAll());
  }
}
