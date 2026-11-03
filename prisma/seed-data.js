const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const bcrypt = require('bcryptjs');

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('--- Iniciando sembrado de datos contables (PUC y empresa base) ---');

  // 1. Crear o actualizar Empresa
  const company = await prisma.company.upsert({
    where: { taxId: '900.876.543-1' },
    update: {
      name: 'Inversiones y Servicios S.A.S.',
      address: 'Calle 100 # 15-20, Bogotá D.C.',
      phone: '+57 (601) 745-8900',
      email: 'contacto@inversionesyservicios.com',
      currency: 'COP',
      country: 'CO',
    },
    create: {
      id: 'default',
      name: 'Inversiones y Servicios S.A.S.',
      taxId: '900.876.543-1',
      address: 'Calle 100 # 15-20, Bogotá D.C.',
      phone: '+57 (601) 745-8900',
      email: 'contacto@inversionesyservicios.com',
      currency: 'COP',
      country: 'CO',
      fiscalYear: 12,
    },
  });
  console.log(`Empresa creada/actualizada: ${company.name} (${company.id})`);

  // 1b. Crear o actualizar Usuario Administrador Principal
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin2026!*';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      name: 'Administrador Principal',
      email: 'admin@erp.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`Usuario Administrador listo: ${adminUser.email} (Clave por defecto: ${adminPassword})`);

  // Vincular Administrador a la Empresa
  await prisma.userCompany.upsert({
    where: {
      userId_companyId: {
        userId: adminUser.id,
        companyId: company.id,
      },
    },
    update: { role: 'ADMIN' },
    create: {
      userId: adminUser.id,
      companyId: company.id,
      role: 'ADMIN',
    },
  });

  // 2. Crear Configuración del Sistema
  await prisma.systemConfig.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      invoicePrefix: 'FAC',
      invoiceNextNumber: 101,
      defaultTaxRate: 0.19,
      defaultPaymentDays: 30,
      autoDepreciation: true,
      autoClosing: false,
      backupEnabled: true,
    },
  });

  // 3. Crear Plan Único de Cuentas (PUC)
  const pucAccounts = [
    // CLASE 1: ACTIVOS
    { code: '1', name: 'ACTIVO', type: 'ASSET', subtype: 'GROUP', allowsEntry: false },
    { code: '11', name: 'DISPONIBLE', type: 'ASSET', subtype: 'CURRENT_ASSET', allowsEntry: false },
    { code: '1105', name: 'Caja General', type: 'ASSET', subtype: 'CURRENT_ASSET', allowsEntry: true },
    { code: '1110', name: 'Bancos Moneda Nacional', type: 'ASSET', subtype: 'CURRENT_ASSET', allowsEntry: true },
    { code: '13', name: 'DEUDORES', type: 'ASSET', subtype: 'CURRENT_ASSET', allowsEntry: false },
    { code: '1305', name: 'Clientes Nacionales', type: 'ASSET', subtype: 'CURRENT_ASSET', allowsEntry: true },
    { code: '1355', name: 'Anticipo de Impuestos y Retenciones (ReteFuente)', type: 'ASSET', subtype: 'CURRENT_ASSET', allowsEntry: true },
    { code: '14', name: 'INVENTARIOS', type: 'ASSET', subtype: 'CURRENT_ASSET', allowsEntry: false },
    { code: '1410', name: 'Inventario de Productos en Proceso', type: 'ASSET', subtype: 'CURRENT_ASSET', allowsEntry: true },
    { code: '1430', name: 'Inventario de Productos Terminados', type: 'ASSET', subtype: 'CURRENT_ASSET', allowsEntry: true },
    { code: '1435', name: 'Mercancías No Fabricadas por la Empresa', type: 'ASSET', subtype: 'CURRENT_ASSET', allowsEntry: true },
    { code: '15', name: 'PROPIEDAD, PLANTA Y EQUIPO', type: 'ASSET', subtype: 'FIXED_ASSET', allowsEntry: false },
    { code: '1524', name: 'Equipo de Oficina', type: 'ASSET', subtype: 'FIXED_ASSET', allowsEntry: true },
    { code: '1528', name: 'Equipo de Computación y Comunicación', type: 'ASSET', subtype: 'FIXED_ASSET', allowsEntry: true },
    { code: '1540', name: 'Flota y Equipo de Transporte', type: 'ASSET', subtype: 'FIXED_ASSET', allowsEntry: true },
    { code: '1592', name: 'Depreciación Acumulada', type: 'ASSET', subtype: 'FIXED_ASSET', allowsEntry: true },

    // CLASE 2: PASIVOS
    { code: '2', name: 'PASIVO', type: 'LIABILITY', subtype: 'GROUP', allowsEntry: false },
    { code: '21', name: 'OBLIGACIONES FINANCIERAS', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', allowsEntry: false },
    { code: '2105', name: 'Bancos Nacionales (Créditos / Pagarés)', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', allowsEntry: true },
    { code: '22', name: 'PROVEEDORES', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', allowsEntry: false },
    { code: '2205', name: 'Proveedores Nacionales', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', allowsEntry: true },
    { code: '23', name: 'CUENTAS POR PAGAR', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', allowsEntry: false },
    { code: '2335', name: 'Costos y Gastos por Pagar', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', allowsEntry: true },
    { code: '2365', name: 'Retención en la Fuente por Pagar', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', allowsEntry: true },
    { code: '2367', name: 'Impuesto a las Ventas Retenido (ReteIVA)', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', allowsEntry: true },
    { code: '2368', name: 'Impuesto de Industria y Comercio Retenido (ReteICA)', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', allowsEntry: true },
    { code: '24', name: 'IMPUESTOS, GRAVAMENES Y TASAS', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', allowsEntry: false },
    { code: '2408', name: 'Impuesto sobre las Ventas por Pagar (IVA)', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', allowsEntry: true },

    // CLASE 3: PATRIMONIO
    { code: '3', name: 'PATRIMONIO', type: 'EQUITY', subtype: 'GROUP', allowsEntry: false },
    { code: '31', name: 'CAPITAL SOCIAL', type: 'EQUITY', subtype: 'EQUITY', allowsEntry: false },
    { code: '3105', name: 'Capital Suscrito y Pagado', type: 'EQUITY', subtype: 'EQUITY', allowsEntry: true },
    { code: '36', name: 'RESULTADOS DEL EJERCICIO', type: 'EQUITY', subtype: 'EQUITY', allowsEntry: false },
    { code: '3605', name: 'Utilidad del Ejercicio', type: 'EQUITY', subtype: 'EQUITY', allowsEntry: true },
    { code: '37', name: 'RESULTADOS DE EJERCICIOS ANTERIORES', type: 'EQUITY', subtype: 'EQUITY', allowsEntry: false },
    { code: '3705', name: 'Utilidades Acumuladas o Retenidas', type: 'EQUITY', subtype: 'EQUITY', allowsEntry: true },

    // CLASE 4: INGRESOS
    { code: '4', name: 'INGRESOS', type: 'REVENUE', subtype: 'GROUP', allowsEntry: false },
    { code: '41', name: 'OPERACIONALES', type: 'REVENUE', subtype: 'REVENUE', allowsEntry: false },
    { code: '4135', name: 'Comercio al por Mayor y al por Menor', type: 'REVENUE', subtype: 'REVENUE', allowsEntry: true },
    { code: '4175', name: 'Devoluciones en Ventas', type: 'REVENUE', subtype: 'REVENUE', allowsEntry: true },
    { code: '42', name: 'NO OPERACIONALES', type: 'REVENUE', subtype: 'REVENUE', allowsEntry: false },
    { code: '4210', name: 'Ingresos Financieros', type: 'REVENUE', subtype: 'REVENUE', allowsEntry: true },

    // CLASE 5: GASTOS
    { code: '5', name: 'GASTOS', type: 'EXPENSE', subtype: 'GROUP', allowsEntry: false },
    { code: '51', name: 'OPERACIONALES DE ADMINISTRACION', type: 'EXPENSE', subtype: 'EXPENSE', allowsEntry: false },
    { code: '5105', name: 'Gastos de Personal (Nómina y Salarios)', type: 'EXPENSE', subtype: 'EXPENSE', allowsEntry: true },
    { code: '5135', name: 'Servicios Básicos y Arrendamientos', type: 'EXPENSE', subtype: 'EXPENSE', allowsEntry: true },
    { code: '5160', name: 'Depreciaciones', type: 'EXPENSE', subtype: 'EXPENSE', allowsEntry: true },
    { code: '53', name: 'NO OPERACIONALES', type: 'EXPENSE', subtype: 'EXPENSE', allowsEntry: false },
    { code: '5305', name: 'Gastos Financieros (Comisiones y GMF 4x1000)', type: 'EXPENSE', subtype: 'EXPENSE', allowsEntry: true },

    // CLASE 6: COSTOS DE VENTAS
    { code: '6', name: 'COSTOS DE VENTAS', type: 'EXPENSE', subtype: 'GROUP', allowsEntry: false },
    { code: '61', name: 'COSTO DE VENTAS Y OPERACION', type: 'EXPENSE', subtype: 'EXPENSE', allowsEntry: false },
    { code: '6135', name: 'Comercio al por Mayor y Menor (Costo)', type: 'EXPENSE', subtype: 'EXPENSE', allowsEntry: true },

    // CLASE 7: COSTOS DE PRODUCCION O MANUFACTURA
    { code: '7', name: 'COSTOS DE PRODUCCION', type: 'EXPENSE', subtype: 'GROUP', allowsEntry: false },
    { code: '7105', name: 'Materia Prima Directa', type: 'EXPENSE', subtype: 'EXPENSE', allowsEntry: true },
    { code: '7205', name: 'Mano de Obra Directa', type: 'EXPENSE', subtype: 'EXPENSE', allowsEntry: true },
    { code: '7305', name: 'Costos Indirectos de Fabricación (CIF)', type: 'EXPENSE', subtype: 'EXPENSE', allowsEntry: true },
  ];

  const createdAccounts = {};
  for (const acc of pucAccounts) {
    const created = await prisma.account.upsert({
      where: { code_companyId: { code: acc.code, companyId: company.id } },
      update: { name: acc.name, type: acc.type, subtype: acc.subtype, allowsEntry: acc.allowsEntry },
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        subtype: acc.subtype,
        allowsEntry: acc.allowsEntry,
        companyId: company.id,
      },
    });
    createdAccounts[acc.code] = created;
  }
  console.log(`Plan Único de Cuentas sembrado: ${pucAccounts.length} cuentas registradas.`);

  // 4. Crear Cuenta Bancaria Principal
  let bankAccount = await prisma.bankAccount.findFirst({
    where: { companyId: company.id, accountNumber: '1029-384728-1' },
  });

  if (!bankAccount) {
    bankAccount = await prisma.bankAccount.create({
      data: {
        name: 'Bancolombia Cuenta Corriente Empresarial',
        bankName: 'Bancolombia',
        accountNumber: '1029-384728-1',
        accountType: 'CHECKING',
        currency: 'COP',
        currentBalance: 48500000,
        companyId: company.id,
      },
    });
    console.log(`Cuenta bancaria creada: ${bankAccount.name}`);
  }

  // 5. Crear Contactos (Clientes y Proveedores)
  const contactsData = [
    {
      name: 'Distribuidora Comercial Andina S.A.S.',
      taxId: '901.234.567-8',
      type: 'CUSTOMER',
      email: 'contabilidad@andina.com.co',
      phone: '+57 315 234 5678',
      address: 'Carrera 7 # 72-10',
      city: 'Bogotá',
      creditLimit: 35000000,
      paymentDays: 30,
    },
    {
      name: 'Muebles & Diseños Industriales Ltda.',
      taxId: '860.987.654-3',
      type: 'SUPPLIER',
      email: 'facturacion@mueblesindustriales.co',
      phone: '+57 300 987 6543',
      address: 'Zona Industrial Cazucá',
      city: 'Soacha',
      creditLimit: 20000000,
      paymentDays: 45,
    },
    {
      name: 'Soluciones Logísticas Nacionales S.A.',
      taxId: '900.555.333-2',
      type: 'BOTH',
      email: 'contacto@logisticasnacionales.com',
      phone: '+57 320 555 3332',
      address: 'Calle 26 # 68-30',
      city: 'Medellín',
      creditLimit: 15000000,
      paymentDays: 15,
    },
  ];

  const createdContacts = [];
  for (const c of contactsData) {
    const existing = await prisma.contact.findFirst({
      where: { companyId: company.id, name: c.name },
    });
    if (!existing) {
      const created = await prisma.contact.create({
        data: { ...c, companyId: company.id },
      });
      createdContacts.push(created);
    } else {
      createdContacts.push(existing);
    }
  }
  console.log(`Contactos registrados: ${createdContacts.length}`);

  // 6. Crear Asiento de Apertura Balanceado
  const existingEntries = await prisma.journalEntry.count({ where: { companyId: company.id } });
  if (existingEntries === 0) {
    const openingDate = new Date('2026-01-01T08:00:00Z');
    await prisma.journalEntry.create({
      data: {
        number: 1,
        date: openingDate,
        description: 'Asiento de balance de apertura - Inicio de operaciones 2026',
        reference: 'APE-2026-001',
        type: 'MANUAL',
        status: 'POSTED',
        companyId: company.id,
        lines: {
          create: [
            // Débitos (Activos)
            { accountId: createdAccounts['1110'].id, description: 'Saldo inicial en Bancolombia', debit: 48500000, credit: 0 },
            { accountId: createdAccounts['1105'].id, description: 'Fondo de Caja menor', debit: 1500000, credit: 0 },
            { accountId: createdAccounts['1305'].id, description: 'Cartera clientes pendientes', debit: 12400000, credit: 0 },
            { accountId: createdAccounts['1430'].id, description: 'Inventario inicial producto terminado', debit: 18600000, credit: 0 },
            { accountId: createdAccounts['1524'].id, description: 'Mobiliario y equipo de oficina', debit: 9000000, credit: 0 },
            { accountId: createdAccounts['1528'].id, description: 'Servidores y computadores', debit: 15000000, credit: 0 },
            // Créditos (Pasivos y Patrimonio)
            { accountId: createdAccounts['2105'].id, description: 'Obligación bancaria pagaré comercial', debit: 0, credit: 20000000 },
            { accountId: createdAccounts['2205'].id, description: 'Facturas pendientes proveedores', debit: 0, credit: 15000000 },
            { accountId: createdAccounts['3105'].id, description: 'Capital suscrito y pagado por socios', debit: 0, credit: 50000000 },
            { accountId: createdAccounts['3705'].id, description: 'Utilidades retenidas periodos anteriores', debit: 0, credit: 20000000 },
          ],
        },
      },
    });

    // Asiento 2: Venta de productos con IVA y ReteFuente
    await prisma.journalEntry.create({
      data: {
        number: 2,
        date: new Date('2026-02-15T10:00:00Z'),
        description: 'Factura de venta FAC-001 a Distribuidora Andina',
        reference: 'FAC-001',
        type: 'INVOICE',
        status: 'POSTED',
        companyId: company.id,
        lines: {
          create: [
            { accountId: createdAccounts['1305'].id, description: 'Cuenta por cobrar cliente', debit: 11650000, credit: 0 },
            { accountId: createdAccounts['1355'].id, description: 'Anticipo ReteFuente 2.5%', debit: 250000, credit: 0 },
            { accountId: createdAccounts['4135'].id, description: 'Ingreso venta productos', debit: 0, credit: 10000000 },
            { accountId: createdAccounts['2408'].id, description: 'IVA Generado 19%', debit: 0, credit: 1900000 },
          ],
        },
      },
    });

    // Asiento 3: Costo de Venta asociado a la factura FAC-001
    await prisma.journalEntry.create({
      data: {
        number: 3,
        date: new Date('2026-02-15T10:30:00Z'),
        description: 'Costo de ventas asociado a FAC-001',
        reference: 'COS-001',
        type: 'MANUAL',
        status: 'POSTED',
        companyId: company.id,
        lines: {
          create: [
            { accountId: createdAccounts['6135'].id, description: 'Costo mercancía despachada', debit: 5500000, credit: 0 },
            { accountId: createdAccounts['1430'].id, description: 'Salida de inventario terminado', debit: 0, credit: 5500000 },
          ],
        },
      },
    });

    // Asiento 4: Gasto de Nómina y Servicios
    await prisma.journalEntry.create({
      data: {
        number: 4,
        date: new Date('2026-02-28T17:00:00Z'),
        description: 'Pago de nómina y servicios mes de febrero',
        reference: 'NOM-FEB-2026',
        type: 'MANUAL',
        status: 'POSTED',
        companyId: company.id,
        lines: {
          create: [
            { accountId: createdAccounts['5105'].id, description: 'Sueldos y aportes de personal', debit: 3800000, credit: 0 },
            { accountId: createdAccounts['5135'].id, description: 'Servicios de telecomunicaciones y nube', debit: 650000, credit: 0 },
            { accountId: createdAccounts['1110'].id, description: 'Transferencia Bancolombia', debit: 0, credit: 4450000 },
          ],
        },
      },
    });
    console.log('Asientos contables iniciales creados exitosamente con balance perfecto.');
  }

  // 7. Crear Transacciones Bancarias para Conciliación
  const existingBankTxs = await prisma.bankTransaction.count({ where: { bankAccountId: bankAccount.id } });
  if (existingBankTxs === 0) {
    const sampleBankTxs = [
      {
        date: new Date('2026-02-16T14:30:00Z'),
        description: 'TRANSF RECIBIDA DISTRIBUIDORA ANDINA FAC-001',
        amount: 11650000,
        type: 'CREDIT',
        reference: 'TR-982145',
        isReconciled: false,
      },
      {
        date: new Date('2026-02-28T18:00:00Z'),
        description: 'PAGO ELECTRONICO NOMINA Y PROVEEDORES',
        amount: 4450000,
        type: 'DEBIT',
        reference: 'NOM-FEB-2026',
        isReconciled: false,
      },
      {
        date: new Date('2026-03-01T06:00:00Z'),
        description: 'COMISION MANEJO PORTAL EMPRESARIAL',
        amount: 85000,
        type: 'DEBIT',
        reference: 'BANCO-COM-01',
        isReconciled: false,
      },
      {
        date: new Date('2026-03-01T06:05:00Z'),
        description: 'GRAVAMEN MOVIMIENTO FINANCIERO 4X1000',
        amount: 17800,
        type: 'DEBIT',
        reference: 'GMF-4X1000-01',
        isReconciled: false,
      },
      {
        date: new Date('2026-03-05T11:20:00Z'),
        description: 'ABONO CLIENTE SOLUCIONES LOGISTICAS',
        amount: 4300000,
        type: 'CREDIT',
        reference: 'TR-553210',
        isReconciled: false,
      },
    ];

    for (const tx of sampleBankTxs) {
      await prisma.bankTransaction.create({
        data: {
          ...tx,
          bankAccountId: bankAccount.id,
        },
      });
    }
    console.log(`Transacciones bancarias para conciliación registradas: ${sampleBankTxs.length}`);
  }

  // 8. Crear Órdenes de Producción de Muestra
  const existingOrders = await prisma.productionOrder.count({ where: { companyId: company.id } });
  if (existingOrders === 0) {
    const order1 = await prisma.productionOrder.create({
      data: {
        number: 'OP-2026-001',
        product: 'Escritorio Ejecutivo Ergonomico Roble',
        quantity: 25,
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-02-25'),
        status: 'CLOSED',
        totalCost: 11250000,
        companyId: company.id,
        costs: {
          create: [
            { type: 'MATERIAL', description: 'Tableros de roble macizo 25mm (25 uds)', quantity: 25, unitCost: 260000, total: 6500000 },
            { type: 'MATERIAL', description: 'Herrajes y tornillería de acero inoxidable', quantity: 25, unitCost: 40000, total: 1000000 },
            { type: 'LABOR', description: 'Mano de obra ensamble y pulido (50 horas)', quantity: 50, unitCost: 50000, total: 2500000 },
            { type: 'OVERHEAD', description: 'Energía de planta, barnizado y fletes', quantity: 1, unitCost: 1250000, total: 1250000 },
          ],
        },
      },
    });

    const order2 = await prisma.productionOrder.create({
      data: {
        number: 'OP-2026-002',
        product: 'Silla Gerencial Ergonómica Cuero',
        quantity: 40,
        startDate: new Date('2026-03-01'),
        status: 'OPEN',
        totalCost: 8400000,
        companyId: company.id,
        costs: {
          create: [
            { type: 'MATERIAL', description: 'Estructuras metálicas y pistones hidráulicos', quantity: 40, unitCost: 110000, total: 4400000 },
            { type: 'MATERIAL', description: 'Espuma viscoelástica y cuero sintético premium', quantity: 40, unitCost: 65000, total: 2600000 },
            { type: 'LABOR', description: 'Horas de costura y tapicería (28 horas)', quantity: 28, unitCost: 50000, total: 1400000 },
          ],
        },
      },
    });
    console.log(`Órdenes de producción creadas: ${order1.number} (Cerrada) y ${order2.number} (En curso).`);
  }

  // 9. Crear Activos Fijos
  const existingAssets = await prisma.fixedAsset.count({ where: { companyId: company.id } });
  if (existingAssets === 0) {
    await prisma.fixedAsset.create({
      data: {
        code: 'ACT-001',
        name: 'Servidor Central Dell PowerEdge R750',
        description: 'Servidor de base de datos y procesamiento contable',
        category: 'EQUIPMENT',
        acquisitionDate: new Date('2025-01-10'),
        cost: 15000000,
        salvageValue: 1500000,
        usefulLifeYears: 5,
        depreciationMethod: 'STRAIGHT_LINE',
        depreciationRate: 0.2,
        accumulatedDep: 3500000,
        status: 'ACTIVE',
        location: 'Data Center Bogotá',
        companyId: company.id,
      },
    });

    await prisma.fixedAsset.create({
      data: {
        code: 'ACT-002',
        name: 'Mobiliario Modular Gerencial',
        description: 'Escritorios, estanterías y sillas ejecutivas oficina principal',
        category: 'EQUIPMENT',
        acquisitionDate: new Date('2025-03-15'),
        cost: 9000000,
        salvageValue: 900000,
        usefulLifeYears: 10,
        depreciationMethod: 'STRAIGHT_LINE',
        depreciationRate: 0.1,
        accumulatedDep: 900000,
        status: 'ACTIVE',
        location: 'Oficina 501',
        companyId: company.id,
      },
    });
    console.log('Activos fijos registrados.');
  }

  console.log('=== SEMBRADO CONTABLE COMPLETADO CON ÉXITO ===');
}

seed()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
