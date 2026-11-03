import { prisma } from "../prisma";
import { AccountingEngine } from "../accounting/double-entry";

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location?: string | null;
  manager?: string | null;
  capacityM3: number;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: "MATERIA_PRIMA" | "PRODUCTO_TERMINADO" | "MERCANCIA_COMERCIAL" | string;
  unit: "UND" | "KG" | "MTR" | "LITRO" | string;
  minStock: number;
  maxStock: number;
  standardCost: number;
  salePrice: number;
}

export interface KardexMovement {
  id: string;
  date: string;
  type: "IN" | "OUT" | "TRANSFER" | string;
  reason: "COMPRA" | "PRODUCCION" | "VENTA" | "CONSUMO_INTERNO" | "TRASLADO" | "AJUSTE" | string;
  warehouseId: string;
  targetWarehouseId?: string | null;
  itemId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  balanceQty: number;
  balanceAvgCost: number;
  balanceTotalValue: number;
  referenceDoc: string;
  notes?: string | null;
}

export const INITIAL_WAREHOUSES = [
  {
    code: "BOD-01",
    name: "Bodega Central Principal",
    location: "Zona Industrial Fontibón, Calle 17 # 88-20, Bogotá",
    manager: "Hernando Silva",
    capacityM3: 1500,
  },
  {
    code: "BOD-02",
    name: "Bodega de Materias Primas & Ensamble",
    location: "Parque Industrial Celta, Autopista Medellín Km 7, Funza",
    manager: "Marta Rodríguez",
    capacityM3: 950,
  },
  {
    code: "BOD-03",
    name: "Bodega de Despachos & Producto Terminado",
    location: "Centro Logístico Siberia, Bodega 12, Cota",
    manager: "Carlos Peñaloza",
    capacityM3: 1200,
  },
];

export const INITIAL_ITEMS = [
  {
    sku: "MAT-001",
    name: "Tablero de Roble Macizo 25mm (2.44 x 1.22m)",
    category: "MATERIA_PRIMA",
    unit: "UND",
    minStock: 15,
    maxStock: 100,
    standardCost: 260000,
    salePrice: 0,
  },
  {
    sku: "MAT-002",
    name: "Estructura de Acero y Pistón Neumático Clase 4",
    category: "MATERIA_PRIMA",
    unit: "UND",
    minStock: 20,
    maxStock: 120,
    standardCost: 110000,
    salePrice: 0,
  },
  {
    sku: "PROD-001",
    name: "Escritorio Ejecutivo Ergonómico Roble 160x80",
    category: "PRODUCTO_TERMINADO",
    unit: "UND",
    minStock: 5,
    maxStock: 50,
    standardCost: 450000,
    salePrice: 850000,
  },
  {
    sku: "PROD-002",
    name: "Silla Gerencial Ergonómica Cuero Premium",
    category: "PRODUCTO_TERMINADO",
    unit: "UND",
    minStock: 8,
    maxStock: 60,
    standardCost: 250000,
    salePrice: 480000,
  },
  {
    sku: "MERC-001",
    name: "Portátil Corporativo Core i7 16GB 512GB SSD",
    category: "MERCANCIA_COMERCIAL",
    unit: "UND",
    minStock: 4,
    maxStock: 30,
    standardCost: 3200000,
    salePrice: 4200000,
  },
  {
    sku: "MERC-002",
    name: "Monitor Profesional Ultrawide 34 IPS 144Hz",
    category: "MERCANCIA_COMERCIAL",
    unit: "UND",
    minStock: 3,
    maxStock: 25,
    standardCost: 1650000,
    salePrice: 2250000,
  },
];

export class KardexService {
  /**
   * Asegura que existan datos iniciales en la base de datos para la empresa
   */
  public static async ensureInitialData(companyId?: string) {
    let targetCompanyId = companyId;
    if (!targetCompanyId) {
      let company = await prisma.company.findFirst();
      if (!company) {
        company = await prisma.company.create({
          data: { name: "Empresa Demo S.A.S.", taxId: "900.876.543-1" },
        });
      }
      targetCompanyId = company.id;
    }

    const warehouseCount = await prisma.warehouse.count({
      where: { companyId: targetCompanyId },
    });

    if (warehouseCount === 0) {
      // Crear bodegas iniciales
      for (const w of INITIAL_WAREHOUSES) {
        await prisma.warehouse.create({
          data: {
            ...w,
            companyId: targetCompanyId,
          },
        });
      }
    }

    const itemCount = await prisma.inventoryItem.count({
      where: { companyId: targetCompanyId },
    });

    if (itemCount === 0) {
      // Crear productos iniciales
      for (const item of INITIAL_ITEMS) {
        await prisma.inventoryItem.create({
          data: {
            ...item,
            companyId: targetCompanyId,
          },
        });
      }

      // Crear movimientos iniciales representativos
      const [wh1, wh2, item1, item3, item5] = await Promise.all([
        prisma.warehouse.findFirst({ where: { companyId: targetCompanyId, code: "BOD-01" } }),
        prisma.warehouse.findFirst({ where: { companyId: targetCompanyId, code: "BOD-02" } }),
        prisma.inventoryItem.findFirst({ where: { companyId: targetCompanyId, sku: "MAT-001" } }),
        prisma.inventoryItem.findFirst({ where: { companyId: targetCompanyId, sku: "PROD-001" } }),
        prisma.inventoryItem.findFirst({ where: { companyId: targetCompanyId, sku: "MERC-001" } }),
      ]);

      if (wh2 && item1) {
        await prisma.kardexMovement.create({
          data: {
            date: new Date("2026-01-05T09:00:00Z"),
            type: "IN",
            reason: "COMPRA",
            warehouseId: wh2.id,
            itemId: item1.id,
            quantity: 40,
            unitCost: 250000,
            totalCost: 10000000,
            balanceQty: 40,
            balanceAvgCost: 250000,
            balanceTotalValue: 10000000,
            referenceDoc: "FAC-PROV-9941",
            notes: "Lote de tableros de roble importados",
            companyId: targetCompanyId,
          },
        });

        await prisma.kardexMovement.create({
          data: {
            date: new Date("2026-01-10T14:30:00Z"),
            type: "IN",
            reason: "COMPRA",
            warehouseId: wh2.id,
            itemId: item1.id,
            quantity: 20,
            unitCost: 280000,
            totalCost: 5600000,
            balanceQty: 60,
            balanceAvgCost: 260000,
            balanceTotalValue: 15600000,
            referenceDoc: "FAC-PROV-1024",
            notes: "Compra de reposición tableros roble",
            companyId: targetCompanyId,
          },
        });

        await prisma.kardexMovement.create({
          data: {
            date: new Date("2026-01-15T11:00:00Z"),
            type: "OUT",
            reason: "CONSUMO_INTERNO",
            warehouseId: wh2.id,
            itemId: item1.id,
            quantity: 15,
            unitCost: 260000,
            totalCost: 3900000,
            balanceQty: 45,
            balanceAvgCost: 260000,
            balanceTotalValue: 11700000,
            referenceDoc: "OP-2026-001",
            notes: "Consumo para orden de manufactura escritorios",
            companyId: targetCompanyId,
          },
        });
      }

      if (wh1 && item5) {
        await prisma.kardexMovement.create({
          data: {
            date: new Date("2026-01-22T10:00:00Z"),
            type: "IN",
            reason: "COMPRA",
            warehouseId: wh1.id,
            itemId: item5.id,
            quantity: 10,
            unitCost: 3200000,
            totalCost: 32000000,
            balanceQty: 10,
            balanceAvgCost: 3200000,
            balanceTotalValue: 32000000,
            referenceDoc: "FAC-DELL-8871",
            notes: "Lote de computadores corporativos",
            companyId: targetCompanyId,
          },
        });
      }
    }

    return targetCompanyId;
  }

  /**
   * Obtener lista de bodegas
   */
  static async getWarehouses(companyId?: string): Promise<Warehouse[]> {
    const targetCompanyId = await this.ensureInitialData(companyId);
    return await prisma.warehouse.findMany({
      where: { companyId: targetCompanyId },
      orderBy: { code: "asc" },
    });
  }

  /**
   * Obtener catálogo de productos / ítems
   */
  static async getItems(companyId?: string): Promise<InventoryItem[]> {
    const targetCompanyId = await this.ensureInitialData(companyId);
    return await prisma.inventoryItem.findMany({
      where: { companyId: targetCompanyId },
      orderBy: { sku: "asc" },
    });
  }

  /**
   * Obtener resumen de existencias consolidadas por ítem (Stock Total, Valoración, Alertas)
   */
  static async getInventorySummary(companyId?: string) {
    const targetCompanyId = await this.ensureInitialData(companyId);
    const [items, warehouses, movements] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: { companyId: targetCompanyId },
        orderBy: { sku: "asc" },
      }),
      prisma.warehouse.findMany({
        where: { companyId: targetCompanyId },
        orderBy: { code: "asc" },
      }),
      prisma.kardexMovement.findMany({
        where: { companyId: targetCompanyId },
        orderBy: { date: "asc" },
      }),
    ]);

    return items.map((item) => {
      const itemMoves = movements.filter((m) => m.itemId === item.id);

      let totalQty = 0;
      let totalVal = 0;

      const warehouseStocks: Record<string, { qty: number; value: number }> = {};
      warehouses.forEach((w) => {
        warehouseStocks[w.id] = { qty: 0, value: 0 };
      });

      for (const m of itemMoves) {
        if (m.type === "IN") {
          const ws = warehouseStocks[m.warehouseId] || { qty: 0, value: 0 };
          ws.qty += m.quantity;
          ws.value += m.totalCost;
          warehouseStocks[m.warehouseId] = ws;
          totalQty += m.quantity;
          totalVal += m.totalCost;
        } else if (m.type === "OUT") {
          const ws = warehouseStocks[m.warehouseId] || { qty: 0, value: 0 };
          ws.qty = Math.max(0, ws.qty - m.quantity);
          ws.value = Math.max(0, ws.value - m.totalCost);
          warehouseStocks[m.warehouseId] = ws;
          totalQty = Math.max(0, totalQty - m.quantity);
          totalVal = Math.max(0, totalVal - m.totalCost);
        } else if (m.type === "TRANSFER" && m.targetWarehouseId) {
          const source = warehouseStocks[m.warehouseId] || { qty: 0, value: 0 };
          const target = warehouseStocks[m.targetWarehouseId] || { qty: 0, value: 0 };

          source.qty = Math.max(0, source.qty - m.quantity);
          source.value = Math.max(0, source.value - m.totalCost);

          target.qty += m.quantity;
          target.value += m.totalCost;

          warehouseStocks[m.warehouseId] = source;
          warehouseStocks[m.targetWarehouseId] = target;
        }
      }

      const avgCost = totalQty > 0 ? totalVal / totalQty : item.standardCost;
      const isLowStock = totalQty <= item.minStock;
      const isOverStock = item.maxStock > 0 && totalQty >= item.maxStock;

      return {
        item,
        totalQty,
        avgCost,
        totalVal,
        isLowStock,
        isOverStock,
        warehouseBreakdown: warehouseStocks,
      };
    });
  }

  /**
   * Obtener la tarjeta de Kardex de un ítem específico (Kardex Físico y Valorado)
   */
  static async getItemKardex(itemId: string, warehouseId?: string, companyId?: string) {
    const targetCompanyId = await this.ensureInitialData(companyId);

    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new Error("Ítem no encontrado");

    let movements = await prisma.kardexMovement.findMany({
      where: {
        companyId: targetCompanyId,
        itemId: itemId,
        ...(warehouseId && warehouseId !== "ALL"
          ? {
              OR: [{ warehouseId }, { targetWarehouseId: warehouseId }],
            }
          : {}),
      },
      orderBy: { date: "asc" },
    });

    let runningQty = 0;
    let runningVal = 0;

    const kardexRows = movements.map((m) => {
      let inQty = 0;
      let inCost = 0;
      let inTotal = 0;
      let outQty = 0;
      let outCost = 0;
      let outTotal = 0;

      if (m.type === "IN") {
        inQty = m.quantity;
        inCost = m.unitCost;
        inTotal = m.totalCost;
        runningQty += inQty;
        runningVal += inTotal;
      } else if (m.type === "OUT") {
        outQty = m.quantity;
        outCost = runningQty > 0 ? runningVal / runningQty : m.unitCost;
        outTotal = outQty * outCost;
        runningQty = Math.max(0, runningQty - outQty);
        runningVal = Math.max(0, runningVal - outTotal);
      } else if (m.type === "TRANSFER") {
        outQty = m.quantity;
        outCost = runningQty > 0 ? runningVal / runningQty : m.unitCost;
        outTotal = outQty * outCost;
        if (warehouseId && m.targetWarehouseId === warehouseId) {
          inQty = m.quantity;
          inCost = outCost;
          inTotal = outTotal;
          runningQty += inQty;
          runningVal += inTotal;
          outQty = 0;
          outCost = 0;
          outTotal = 0;
        } else if (warehouseId && m.warehouseId === warehouseId) {
          runningQty = Math.max(0, runningQty - outQty);
          runningVal = Math.max(0, runningVal - outTotal);
        }
      }

      const balanceAvgCost = runningQty > 0 ? runningVal / runningQty : 0;

      return {
        id: m.id,
        date: m.date.toISOString(),
        type: m.type,
        reason: m.reason,
        warehouseId: m.warehouseId,
        targetWarehouseId: m.targetWarehouseId,
        referenceDoc: m.referenceDoc,
        notes: m.notes,
        inputs: { qty: inQty, unitCost: inCost, total: inTotal },
        outputs: { qty: outQty, unitCost: outCost, total: outTotal },
        balance: { qty: runningQty, avgCost: balanceAvgCost, total: runningVal },
      };
    });

    return {
      item,
      kardexRows,
      finalQty: runningQty,
      finalAvgCost: runningQty > 0 ? runningVal / runningQty : 0,
      finalVal: runningVal,
    };
  }

  /**
   * Registrar nuevo movimiento de Kardex y generar asiento contable en NIIF
   */
  static async registerMovement(
    companyId: string,
    data: {
      type: "IN" | "OUT" | "TRANSFER";
      reason: "COMPRA" | "PRODUCCION" | "VENTA" | "CONSUMO_INTERNO" | "TRASLADO" | "AJUSTE";
      warehouseId: string;
      targetWarehouseId?: string;
      itemId: string;
      quantity: number;
      unitCost?: number;
      referenceDoc: string;
      notes?: string;
      postJournal?: boolean;
    }
  ) {
    await this.ensureInitialData(companyId);

    const item = await prisma.inventoryItem.findUnique({
      where: { id: data.itemId },
    });
    if (!item) throw new Error("Ítem no encontrado");

    // Calcular estado actual para promedio ponderado
    const summary = await this.getInventorySummary(companyId);
    const itemSum = summary.find((s) => s.item.id === data.itemId);
    const currentAvgCost = itemSum && itemSum.totalQty > 0 ? itemSum.avgCost : item.standardCost;

    const unitCost = data.type === "IN" ? (data.unitCost || item.standardCost) : currentAvgCost;
    const totalCost = data.quantity * unitCost;

    let balanceQty = itemSum ? itemSum.totalQty : 0;
    let balanceTotalValue = itemSum ? itemSum.totalVal : 0;

    if (data.type === "IN") {
      balanceQty += data.quantity;
      balanceTotalValue += totalCost;
    } else if (data.type === "OUT") {
      if (balanceQty < data.quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${balanceQty}, Requerido: ${data.quantity}`);
      }
      balanceQty -= data.quantity;
      balanceTotalValue = Math.max(0, balanceTotalValue - totalCost);
    }

    const balanceAvgCost = balanceQty > 0 ? balanceTotalValue / balanceQty : 0;

    const newMovement = await prisma.kardexMovement.create({
      data: {
        date: new Date(),
        type: data.type,
        reason: data.reason,
        warehouseId: data.warehouseId,
        targetWarehouseId: data.targetWarehouseId,
        itemId: data.itemId,
        quantity: data.quantity,
        unitCost,
        totalCost,
        balanceQty,
        balanceAvgCost,
        balanceTotalValue,
        referenceDoc: data.referenceDoc,
        notes: data.notes,
        companyId,
      },
    });

    let journalEntry = null;

    // Generar Asiento Contable Automático en PUC
    if (data.postJournal) {
      if (data.type === "IN" && data.reason === "COMPRA") {
        const invAccountCode = item.category === "MATERIA_PRIMA" ? "1405" : "1435";
        const [invAcc, ivaAcc, supplierAcc] = await Promise.all([
          prisma.account.findFirst({ where: { companyId, code: { startsWith: invAccountCode } } }),
          prisma.account.findFirst({ where: { companyId, code: { startsWith: "2408" } } }),
          prisma.account.findFirst({ where: { companyId, code: { startsWith: "2205" } } }),
        ]);

        if (invAcc && supplierAcc) {
          const ivaRate = 0.19;
          const ivaAmount = totalCost * ivaRate;
          const totalPayable = totalCost + ivaAmount;

          const lines = [
            {
              accountId: invAcc.id,
              description: `Entrada inventario ${item.name} (${data.quantity} ${item.unit} a $${unitCost})`,
              debit: totalCost,
              credit: 0,
            },
            ...(ivaAcc
              ? [
                  {
                    accountId: ivaAcc.id,
                    description: `IVA Descontable compras 19% ref ${data.referenceDoc}`,
                    debit: ivaAmount,
                    credit: 0,
                  },
                ]
              : []),
            {
              accountId: supplierAcc.id,
              description: `Factura proveedor ref ${data.referenceDoc}`,
              debit: 0,
              credit: ivaAcc ? totalPayable : totalCost,
            },
          ];

          journalEntry = await AccountingEngine.createJournalEntry({
            companyId,
            date: new Date(),
            description: `Compra y entrada a bodega ${item.name} - Ref ${data.referenceDoc}`,
            reference: data.referenceDoc,
            type: "MANUAL",
            lines,
          });
        }
      } else if (data.type === "OUT" && (data.reason === "VENTA" || data.reason === "CONSUMO_INTERNO")) {
        const invAccountCode = item.category === "MATERIA_PRIMA" ? "1405" : "1435";
        const costAccountCode = data.reason === "CONSUMO_INTERNO" ? "7105" : "6135";

        const [costAcc, invAcc] = await Promise.all([
          prisma.account.findFirst({ where: { companyId, code: { startsWith: costAccountCode } } }),
          prisma.account.findFirst({ where: { companyId, code: { startsWith: invAccountCode } } }),
        ]);

        if (costAcc && invAcc) {
          const lines = [
            {
              accountId: costAcc.id,
              description: `Costo de salida por ${data.reason.toLowerCase()} - ${item.name} (${data.quantity} uds)`,
              debit: totalCost,
              credit: 0,
            },
            {
              accountId: invAcc.id,
              description: `Descarga inventario por ${data.reason.toLowerCase()}`,
              debit: 0,
              credit: totalCost,
            },
          ];

          journalEntry = await AccountingEngine.createJournalEntry({
            companyId,
            date: new Date(),
            description: `Reconocimiento costo salida de inventario - ${item.name} - Ref ${data.referenceDoc}`,
            reference: data.referenceDoc,
            type: "MANUAL",
            lines,
          });
        }
      }
    }

    return {
      movement: {
        ...newMovement,
        date: newMovement.date.toISOString(),
      },
      journalEntry,
    };
  }
}
