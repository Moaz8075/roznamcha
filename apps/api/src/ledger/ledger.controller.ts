import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ok } from '../common/response';

@ApiTags('ledger')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('customers/:customerId')
  async customer(@Param('customerId') customerId: string) {
    return ok(await this.ledgerService.customerStatement(customerId));
  }

  @Get('suppliers/:supplierId')
  async supplier(@Param('supplierId') supplierId: string) {
    return ok(await this.ledgerService.supplierStatement(supplierId));
  }
}
