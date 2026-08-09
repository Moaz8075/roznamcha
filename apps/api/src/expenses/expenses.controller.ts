import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ok } from '../common/response';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create business or personal expense',
    description:
      'Creates expense record and cash OUT when paymentMethod is CASH. Business and personal stay separate via expenseType.',
  })
  async create(
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: { id: string },
  ) {
    return ok(await this.expensesService.create(dto, user.id), 'Expense saved');
  }

  @Get()
  @ApiOperation({ summary: 'List expenses' })
  async list() {
    return ok(await this.expensesService.findAll());
  }
}
