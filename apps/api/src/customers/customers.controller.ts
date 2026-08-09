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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FinancialTransactionService } from '../transactions/financial-transaction.service';
import { ok } from '../common/response';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly financial: FinancialTransactionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create customer' })
  async create(@Body() dto: CreateCustomerDto) {
    return ok(await this.customersService.create(dto), 'Customer saved');
  }

  @Get()
  @ApiOperation({ summary: 'List customers (with derived balances)' })
  async list(@Query('q') q?: string) {
    return ok(await this.customersService.findAll(q));
  }

  @Get(':id/profit')
  @ApiOperation({ summary: 'Customer profit from sales (cost snapshots)' })
  async profit(@Param('id') id: string) {
    await this.customersService.findOne(id);
    return ok(await this.financial.getCustomerProfit(id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by id' })
  async get(@Param('id') id: string) {
    return ok(await this.customersService.findOne(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return ok(await this.customersService.update(id, dto), 'Customer updated');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete customer' })
  async remove(@Param('id') id: string) {
    return ok(await this.customersService.remove(id), 'Customer deleted');
  }
}
