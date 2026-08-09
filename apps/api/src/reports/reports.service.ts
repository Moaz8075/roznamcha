import { Injectable } from '@nestjs/common';

/**
 * Report service stubs — structure ready for full implementations.
 * All money math must use Decimal via FinancialTransactionService / Prisma aggregates.
 */
@Injectable()
export class ReportsService {
  health() {
    return { ready: true as const };
  }

  // Planned:
  // customerStatement, supplierStatement, dailyRoznamcha, cashSummary,
  // salesReport, purchaseReport, businessExpenseReport, personalExpenseReport,
  // pendingCustomerPayments, pendingSupplierPayments, profitAndLoss,
  // customerWiseProfit, productWiseProfit
}
