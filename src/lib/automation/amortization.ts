import { prisma } from "../prisma";

export class AmortizationService {
  /**
   * Calculate amortization schedule for a loan
   */
  static calculateLoanAmortization(
    principal: number,
    annualRate: number,
    termMonths: number,
    startDate: Date
  ): Array<{
    period: number;
    date: Date;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }> {
    const monthlyRate = annualRate / 12;
    const payment =
      monthlyRate > 0
        ? (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
          (Math.pow(1 + monthlyRate, termMonths) - 1)
        : principal / termMonths;

    const schedule = [];
    let balance = principal;

    for (let i = 1; i <= termMonths; i++) {
      const interest = balance * monthlyRate;
      const principalPayment = payment - interest;
      balance = Math.max(0, balance - principalPayment);

      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);

      schedule.push({
        period: i,
        date,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      });
    }

    return schedule;
  }

  /**
   * Calculate intangible asset amortization (straight-line)
   */
  static calculateIntangibleAmortization(
    cost: number,
    usefulLifeMonths: number,
    acquisitionDate: Date
  ): Array<{
    period: string;
    amount: number;
    accumulatedAmount: number;
    bookValue: number;
  }> {
    const monthlyAmount = cost / usefulLifeMonths;
    const schedule = [];
    let accumulated = 0;

    for (let i = 0; i < usefulLifeMonths; i++) {
      const date = new Date(acquisitionDate);
      date.setMonth(date.getMonth() + i + 1);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      accumulated += monthlyAmount;
      const bookValue = Math.max(0, cost - accumulated);

      schedule.push({
        period,
        amount: Math.round(monthlyAmount * 100) / 100,
        accumulatedAmount: Math.round(accumulated * 100) / 100,
        bookValue: Math.round(bookValue * 100) / 100,
      });
    }

    return schedule;
  }

  /**
   * Run amortization for all intangible assets in a company
   */
  static async runMonthlyAmortization(companyId: string, period: string) {
    // Get intangible fixed assets
    const intangibles = await prisma.fixedAsset.findMany({
      where: {
        companyId,
        category: "INTANGIBLE",
        status: "ACTIVE",
      },
    });

    let totalAmortization = 0;

    for (const asset of intangibles) {
      const monthlyAmount = (asset.cost * asset.depreciationRate) / 12;
      if (asset.accumulatedDep >= asset.cost) continue;

      const actual = Math.min(monthlyAmount, asset.cost - asset.accumulatedDep);

      await prisma.fixedAsset.update({
        where: { id: asset.id },
        data: { accumulatedDep: { increment: actual } },
      });

      await prisma.assetDepreciation.create({
        data: { assetId: asset.id, period, amount: actual },
      });

      totalAmortization += actual;
    }

    return totalAmortization;
  }
}
