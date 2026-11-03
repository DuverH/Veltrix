import { AccountingEngine } from "../accounting/double-entry";
import { prisma } from "../prisma";

export class AssetAutomation {
  /**
   * Runs the monthly depreciation process for all active fixed assets.
   * Generates the corresponding journal entries.
   */
  static async runMonthlyDepreciation(companyId: string, depreciationDate: Date) {
    const assets = await prisma.fixedAsset.findMany({
      where: { companyId }
    });

    // We assume the company has predefined account IDs for this operation
    // For MVP purposes we mock these IDs
    const DEPRECIATION_EXPENSE_ACCOUNT = "acc-expense-depr";
    const ACCUMULATED_DEPRECIATION_ACCOUNT = "acc-asset-accum-depr";

    let totalDepreciation = 0;
    const lines = [];

    for (const asset of assets) {
      // Calculate monthly depreciation (Straight-line method)
      // Rate is annual (e.g. 0.1 for 10%), so we divide by 12
      const monthlyDepreciation = (asset.cost * asset.depreciationRate) / 12;
      
      // If fully depreciated, skip
      if (asset.accumulatedDep >= asset.cost) continue;

      const actualDepreciation = Math.min(monthlyDepreciation, asset.cost - asset.accumulatedDep);

      // Update asset's accumulated depreciation
      await prisma.fixedAsset.update({
        where: { id: asset.id },
        data: {
          accumulatedDep: {
            increment: actualDepreciation
          }
        }
      });

      totalDepreciation += actualDepreciation;
    }

    if (totalDepreciation > 0) {
      // Register Journal Entry
      await AccountingEngine.createJournalEntry({
        companyId,
        date: depreciationDate,
        description: `Depreciación mensual de activos fijos - ${depreciationDate.toISOString().slice(0, 7)}`,
        lines: [
          {
            accountId: DEPRECIATION_EXPENSE_ACCOUNT,
            debit: totalDepreciation,
            credit: 0
          },
          {
            accountId: ACCUMULATED_DEPRECIATION_ACCOUNT,
            debit: 0,
            credit: totalDepreciation
          }
        ]
      });
    }

    return totalDepreciation;
  }
}
