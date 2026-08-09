import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CashService } from './cash.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ok } from '../common/response';

@ApiTags('cash')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Get('balance')
  async balance() {
    return ok(await this.cashService.getBalance());
  }

  @Get('roznamcha')
  async roznamcha(@Query('date') date?: string) {
    return ok(await this.cashService.getRoznamcha(date));
  }
}
