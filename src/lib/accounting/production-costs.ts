import { prisma } from "../prisma";
import { AccountingEngine } from "./double-entry";

export interface BOMRecipeItem {
  type: "MATERIAL" | "LABOR" | "OVERHEAD";
  description: string;
  unitCost: number;
  qtyPerUnit: number;
}

export interface BOMTemplate {
  product: string;
  description: string;
  items: BOMRecipeItem[];
}

export const STANDARD_BOMS: BOMTemplate[] = [
  {
    product: "Escritorio Ejecutivo Ergonomico Roble",
    description: "Escritorio de roble macizo con acabado pulido y estructura metálica",
    items: [
      { type: "MATERIAL", description: "Tablero roble 25mm", unitCost: 260000, qtyPerUnit: 1 },
      { type: "MATERIAL", description: "Juego herrajes y pernos", unitCost: 40000, qtyPerUnit: 1 },
      { type: "LABOR", description: "Mano de obra ensamble y acabado (2 hrs)", unitCost: 50000, qtyPerUnit: 2 },
      { type: "OVERHEAD", description: "Costos indirectos (barniz, flete, energía)", unitCost: 50000, qtyPerUnit: 1 },
    ],
  },
  {
    product: "Silla Gerencial Ergonómica Cuero",
    description: "Silla ergonómica de oficina con pistón a gas y tapizado en cuero sintético",
    items: [
      { type: "MATERIAL", description: "Estructura metálica y pistón clase 4", unitCost: 110000, qtyPerUnit: 1 },
      { type: "MATERIAL", description: "Espuma viscoelástica y cuero", unitCost: 65000, qtyPerUnit: 1 },
      { type: "LABOR", description: "Costura y tapizado (1.5 hrs)", unitCost: 50000, qtyPerUnit: 1.5 },
      { type: "OVERHEAD", description: "Costos indirectos de fábrica", unitCost: 25000, qtyPerUnit: 1 },
    ],
  },
  {
    product: "Estantería Metálica Industrial 5 Niveles",
    description: "Estantería de acero galvanizado para almacenamiento de carga pesada",
    items: [
      { type: "MATERIAL", description: "Perfiles de acero galvanizado (4 uds)", unitCost: 45000, qtyPerUnit: 4 },
      { type: "MATERIAL", description: "Bandejas metálicas reforzadas (5 uds)", unitCost: 35000, qtyPerUnit: 5 },
      { type: "LABOR", description: "Corte, soldadura y pintura electrostática", unitCost: 60000, qtyPerUnit: 1 },
      { type: "OVERHEAD", description: "Energía y depreciación de troqueladora", unitCost: 30000, qtyPerUnit: 1 },
    ],
  },
];

export class ProductionCostService {
  /**
   * Get list of standard BOM templates
   */
  static getBOMTemplates() {
    return STANDARD_BOMS;
  }

  /**
   * Create a new production order (with optional automatic BOM population)
   */
  static async createOrder(
    companyId: string,
    data: {
      number: string;
      product: string;
      quantity: number;
      startDate: Date;
      endDate?: Date;
      applyBOM?: boolean;
    }
  ) {
    const order = await prisma.productionOrder.create({
      data: {
        companyId,
        number: data.number,
        product: data.product,
        quantity: data.quantity,
        startDate: data.startDate,
        endDate: data.endDate,
        status: "OPEN",
        totalCost: 0,
      },
    });

    // Si se seleccionó aplicar receta estándar BOM
    if (data.applyBOM) {
      const template = STANDARD_BOMS.find(
        (b) => b.product.toLowerCase() === data.product.toLowerCase()
      );

      if (template) {
        let total = 0;
        for (const item of template.items) {
          const qty = item.qtyPerUnit * data.quantity;
          const costTotal = qty * item.unitCost;
          await prisma.productionCost.create({
            data: {
              orderId: order.id,
              type: item.type,
              description: item.description,
              quantity: qty,
              unitCost: item.unitCost,
              total: costTotal,
            },
          });
          total += costTotal;
        }

        await prisma.productionOrder.update({
          where: { id: order.id },
          data: { totalCost: total },
        });

        return prisma.productionOrder.findUnique({
          where: { id: order.id },
          include: { costs: true },
        });
      }
    }

    return order;
  }

  /**
   * Add a cost to a production order
   */
  static async addCost(
    orderId: string,
    cost: {
      type: "MATERIAL" | "LABOR" | "OVERHEAD";
      description: string;
      quantity: number;
      unitCost: number;
    }
  ) {
    const total = cost.quantity * cost.unitCost;

    const costRecord = await prisma.productionCost.create({
      data: {
        orderId,
        type: cost.type,
        description: cost.description,
        quantity: cost.quantity,
        unitCost: cost.unitCost,
        total,
      },
    });

    // Update order total cost
    await prisma.productionOrder.update({
      where: { id: orderId },
      data: { totalCost: { increment: total } },
    });

    return costRecord;
  }

  /**
   * Get cost summary for an order
   */
  static async getOrderCostSummary(orderId: string) {
    const order = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: { costs: true },
    });

    if (!order) throw new Error("Orden no encontrada");

    const materialCosts = order.costs
      .filter((c) => c.type === "MATERIAL")
      .reduce((s, c) => s + c.total, 0);

    const laborCosts = order.costs
      .filter((c) => c.type === "LABOR")
      .reduce((s, c) => s + c.total, 0);

    const overheadCosts = order.costs
      .filter((c) => c.type === "OVERHEAD")
      .reduce((s, c) => s + c.total, 0);

    const unitCost = order.quantity > 0 ? order.totalCost / order.quantity : 0;

    return {
      order,
      materialCosts,
      laborCosts,
      overheadCosts,
      totalCost: order.totalCost,
      unitCost,
    };
  }

  /**
   * Close a production order and generate finished goods inventory journal entry
   */
  static async closeOrder(orderId: string) {
    const order = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: { company: true },
    });

    if (!order) throw new Error("Orden de producción no encontrada");
    if (order.status === "CLOSED") throw new Error("La orden ya se encuentra cerrada");

    let journalEntry = null;

    // Si la orden acumuló costos, generar el asiento de traslado a Inventario de Producto Terminado
    if (order.totalCost > 0) {
      // Buscar cuenta 1430 (Inventario Producto Terminado)
      let finishedGoodsAcc = await prisma.account.findFirst({
        where: { companyId: order.companyId, code: { startsWith: "1430" } },
      });
      // Buscar cuenta 1410 (Inventario en Proceso) o 7105 (Costos de Producción)
      let wipAcc = await prisma.account.findFirst({
        where: {
          companyId: order.companyId,
          OR: [{ code: { startsWith: "1410" } }, { code: { startsWith: "7105" } }],
        },
      });

      // Fallback si no existieran
      if (!finishedGoodsAcc) {
        finishedGoodsAcc = await prisma.account.findFirst({
          where: { companyId: order.companyId, type: "ASSET" },
        });
      }
      if (!wipAcc) {
        wipAcc = await prisma.account.findFirst({
          where: { companyId: order.companyId, type: "EXPENSE" },
        });
      }

      if (finishedGoodsAcc && wipAcc) {
        journalEntry = await AccountingEngine.createJournalEntry({
          companyId: order.companyId,
          date: new Date(),
          description: `Cierre y traslado a Producto Terminado - Orden ${order.number} (${order.product}, ${order.quantity} uds)`,
          reference: order.number,
          type: "MANUAL",
          lines: [
            {
              accountId: finishedGoodsAcc.id,
              description: `Entrada a bodega: ${order.product} (Costo unit: $${(order.totalCost / order.quantity).toFixed(2)})`,
              debit: order.totalCost,
              credit: 0,
            },
            {
              accountId: wipAcc.id,
              description: `Liquidación de costos de manufactura orden ${order.number}`,
              debit: 0,
              credit: order.totalCost,
            },
          ],
        });
      }
    }

    // Actualizar estado a CLOSED
    const updated = await prisma.productionOrder.update({
      where: { id: orderId },
      data: { status: "CLOSED", endDate: new Date() },
      include: { costs: true },
    });

    return {
      order: updated,
      journalEntry,
    };
  }

  /**
   * Get all orders for a company with cost summaries
   */
  static async getCompanyOrders(companyId: string) {
    return prisma.productionOrder.findMany({
      where: { companyId },
      include: { costs: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
