# Veltrix ERP · Manual Integral de Usuario, Operación y Desarrollo Técnico

> **Versión**: 1.0.0  
> **Sistema**: Veltrix ERP (Next.js 16, React 19, Prisma 7, LibSQL/Turso, Tailwind CSS v4)  
> **Jurisdicción**: Colombia (Normativa NIIF / DIAN)  
> **Última actualización**: Noviembre 2026  

---

## 📑 Tabla de Contenido

1. [Arquitectura General del Sistema](#1-arquitectura-general-del-sistema)
2. [Guía de Navegación e Interfaz de Usuario](#2-guía-de-navegación-e-interfaz-de-usuario)
3. [Módulo 1: Dashboard Financiero Ejecutivo](#módulo-1-dashboard-financiero-ejecutivo)
4. [Módulo 2: Libro Diario & Plan Único de Cuentas (PUC)](#módulo-2-libro-diario--plan-único-de-cuentas-puc)
5. [Módulo 3: Asistente IA Contable & OCR](#módulo-3-asistente-ia-contable--ocr)
6. [Módulo 4: Facturación Electrónica DIAN & DSE](#módulo-4-facturación-electrónica-dian--dse)
7. [Módulo 5: Tesorería, Cartera & Flujo de Caja](#módulo-5-tesorería-cartera--flujo-de-caja)
8. [Módulo 6: Conciliación Bancaria](#módulo-6-conciliación-bancaria)
9. [Módulo 7: Inventarios & Kardex Multi-bodega](#módulo-7-inventarios--kardex-multi-bodega)
10. [Módulo 8: Nómina Electrónica & Seguridad Social](#módulo-8-nómina-electrónica--seguridad-social)
11. [Módulo 9: Costos de Producción & Manufactura](#módulo-9-costos-de-producción--manufactura)
12. [Módulo 10: Cierres Contables & Bloqueo Fiscal](#módulo-10-cierres-contables--bloqueo-fiscal)
13. [Módulo 11: Préstamos Bancarios & Amortización](#módulo-11-préstamos-bancarios--amortización)
14. [Módulo 12: Activos Fijos & Depreciación NIIF](#módulo-12-activos-fijos--depreciación-niif)
15. [Módulo 13: Terceros (Clientes, Proveedores y Empleados)](#módulo-13-terceros-clientes-proveedores-y-empleados)
16. [Módulo 14: Estados Financieros NIIF (Balance, PyG, Flujo)](#módulo-14-estados-financieros-niif-balance-pyg-flujo)
17. [Módulo 15: Auditoría Inmutable (Blockchain SHA-256)](#módulo-15-auditoría-inmutable-blockchain-sha-256)
18. [Módulo 16: Configuración del Sistema](#módulo-16-configuración-del-sistema)
19. [Módulo 17: Protección de Datos, Auditoría de Riesgos & Disaster Recovery](#módulo-17-protección-de-datos-auditoría-de-riesgos--disaster-recovery)
20. [Guía para Desarrolladores: Cómo Modificar y Extender](#20-guía-para-desarrolladores-cómo-modificar-y-extender)

---

## 1. Arquitectura General del Sistema

Veltrix está construido con una arquitectura modular full-stack basada en Next.js (App Router):

* **Frontend**: React 19 (Server y Client Components), CSS Variables para renderizado reactivo de temas (Claro y Oscuro Puro OLED), Recharts para visualización analítica y Lucide Icons.
* **Backend**: Route Handlers REST (`/api/*`), NextAuth con estrategia de sesión JWT (30 días).
* **Base de Datos & ORM**: Prisma 7 con `@prisma/adapter-libsql`, compatible nativamente con SQLite local (`dev.db`) y bases de datos serverless distribuidas en la nube con **Turso** (`libsql://`).
* **Seguridad & Integridad**:
  - Partida doble estricta obligatoria (Débitos = Créditos).
  - Bloqueo fiscal de períodos contables cerrados.
  - Cadena criptográfica de bloques SHA-256 para auditoría inalterable.

```
┌────────────────────────────────────────────────────────┐
│                      Next.js 16                        │
│ ┌───────────────────┐        ┌───────────────────────┐ │
│ │  Client / Server  │ ◄────► │ Route Handlers / API  │ │
│ │    Components     │        │    (/api/* REST)      │ │
│ └───────────────────┘        └───────────┬───────────┘ │
│                                          │             │
│                               ┌──────────▼───────────┐ │
│                               │  Servicios Contables │ │
│                               │     (src/lib/*)      │ │
│                               └──────────┬───────────┘ │
│                                          │             │
│                               ┌──────────▼───────────┐ │
│                               │      Prisma ORM      │ │
│                               │  (@prisma/adapter)   │ │
│                               └──────────┬───────────┘ │
└──────────────────────────────────────────┼─────────────┘
                                           ▼
                               ┌───────────────────────┐
                               │ SQLite / Turso LibSQL │
                               └───────────────────────┘
```

---

## 2. Guía de Navegación e Interfaz de Usuario

### 2.1 Menú Lateral Categorizado (Sidebar)
El menú lateral divide las 16 funciones en 4 áreas operativas lógicas:
1. **Panel Principal**: Dashboard Ejecutivo y Asistente IA con OCR.
2. **Contabilidad & NIIF**: Libro Diario, Conciliación, Cierres, Préstamos, Activos Fijos y Costos de Producción.
3. **Operación & Comercial**: Facturación DIAN, Tesorería, Inventarios, Nómina y Terceros.
4. **Informes & Control**: Estados Financieros y Auditoría Inmutable.

### 2.2 Barra Superior (Topbar)
* **Búsqueda Global Inteligente (`Ctrl + K` o `Cmd + K`)**: Permite teclear el nombre de cualquier módulo, factura o cuenta contable y saltar de inmediato sin usar el ratón.
* **Indicador de Empresa Activa**: Muestra la razón social actual (`Inversiones y Servicios S.A.S.`) y la moneda de reporte (`COP`).
* **Modal de Ayuda Rápida (`?`)**: Despliega un resumen operativo y accesos inmediatos.
* **Toggle de Modo Oscuro Puro (OLED)**: Alterna entre el tema claro empresarial y el modo negro profundo (#000000) de máximo contraste.
* **Panel Interactivo de Notificaciones**: Campana con badge en tiempo real de facturas pendientes, movimientos bancarios y cierres automáticos.

---

## Módulo 1: Dashboard Financiero Ejecutivo

* **Ruta de acceso**: `/dashboard`
* **Archivos clave**:
  - Vista: `src/app/dashboard/page.tsx`
  - API: `src/app/api/dashboard/stats/route.ts`

### Propósito
Proporcionar al gerente general, director financiero o contador una visión panorámica de la liquidez, rentabilidad y flujo de caja en tiempo real.

### Utilización
1. **Lectura de KPIs**:
   - **Ingresos Operacionales (Clase 4)**: Total facturado en el mes vigente.
   - **Costos y Gastos (Clase 5 y 6)**: Total erogado en compras, nómina y servicios.
   - **Utilidad Neta Real**: Diferencia matemática (`Ingresos - Gastos - Costos`). Aparece en verde si es positiva o en rojo si hay pérdida.
2. **Barra de Acciones Frecuentes**: Permite saltar en 1 clic a emitir factura, crear asiento diario, conciliar banco o liquidar nómina.
3. **Gráficas Interactivas**:
   - *Ingresos vs Gastos Acumulados*: Gráfica de línea temporal.
   - *Flujo Reciente*: Gráfica de barras de ingresos recientes.
4. **Exportar / Imprimir**: Botón superior que prepara el reporte para PDF o impresora física con estilos de medios limpios.

### Modificación Técnica
* **Agregar un nuevo KPI (ej. EBITDA)**:
  1. En `src/app/api/dashboard/stats/route.ts`, agregar el cálculo sumando ingresos operativos menos costos y gastos operacionales antes de depreciación.
  2. En `src/app/dashboard/page.tsx`, añadir una tarjeta adicional dentro del grid `<div className="dashboard-grid">`.

---

## Módulo 2: Libro Diario & Plan Único de Cuentas (PUC)

* **Ruta de acceso**: `/dashboard/accounting`
* **Archivos clave**:
  - Vista: `src/app/dashboard/accounting/page.tsx`
  - APIs: `src/app/api/journal/route.ts`, `src/app/api/accounts/route.ts`
  - Lógica NIIF: `src/lib/accounting/double-entry.ts`, `src/lib/accounting/ledger.ts`
  - Modelo Prisma: `Account`, `JournalEntry`, `JournalLine`

### Propósito
Centro neurálgico contable bajo NIIF. Administra el catálogo PUC colombiano a 6 dígitos (Activo, Pasivo, Patrimonio, Ingresos, Gastos, Costos) y registra asientos garantizando **partida doble estricta** (Débitos = Créditos).

### Utilización
1. **Consultar Cuentas del PUC**: Usa la pestaña *Catálogo de Cuentas (PUC)* para buscar por código (`110505`) o nombre (`Caja General`).
2. **Crear Asiento Contable Manual**:
   - Pulsa **Nuevo Asiento**.
   - Ingresa concepto, fecha y soporte.
   - Agrega líneas especificando Cuenta, Tercero (NIT), Débito o Crédito.
   - El sistema valida en vivo: si `Suma Débitos != Suma Créditos`, el botón de guardar permanece bloqueado para prevenir descuadres contables.
3. **Comprobación del Mayor General**: Muestra el saldo corrido de cada cuenta.

### Modificación Técnica
* **Añadir nuevas cuentas al PUC**:
  - Ejecutar vía script o API `POST /api/accounts` enviando `{ code: "13050501", name: "Clientes Nacionales Bogotá", type: "ASSET", parentId: "..." }`.
* **Personalizar validación de partida doble**:
  - Editar `src/lib/accounting/double-entry.ts` en la función `validateDoubleEntry()`.

---

## Módulo 3: Asistente IA Contable, OCR & Copilot NIIF

* **Ruta de acceso**: `/dashboard/ai-assistant`
* **Archivos clave**:
  - Vista: `src/app/dashboard/ai-assistant/page.tsx`
  - API: `src/app/api/ai/route.ts`
  - Servicio de Inteligencia Artificial: `src/lib/ai/ai-accounting-service.ts`

### Propósito
Automatiza integralmente la causación de compras, la consulta analítica ejecutiva y la generación de asientos contables mediante redes neuronales, modelos predictivos del PUC colombiano y heurísticas tributarias NIIF/DIAN.

### Características y Funcionalidades por Pestaña

#### 1. Scanner OCR & Facturación Inteligente (UBL 2.1)
* **Plantillas Frecuentes**: Acceso con 1 clic a esquemas de Cloud/Servidores, Honorarios Jurídicos, Arrendamiento y Papelería.
* **Extracción Heurística Automática**: Identifica Razón Social del emisor, NIT, número de factura, fecha de emisión y vencimiento.
* **Mapeo Predictivo PUC NIIF**: Sugiere la cuenta contable exacta (ej. 514510 para tecnología, 512010 para arrendamiento, 511025 para honorarios) con un índice de confianza porcentual.
* **Liquidación Tributaria Exacta**: Calcula Subtotal, IVA Descontable del 19% (+), Retención en la Fuente del 2.5% (-) y el Saldo Neto en Cuentas por Pagar (CXP).
* **Contabilización en 1 Clic**: Guarda el asiento en el Libro Diario (`JournalEntry`) y crea la factura de compra (`Invoice PAYABLE`).

#### 2. Director Financiero Virtual (AI CFO Copilot)
* **Métricas en Vivo**: Consulta en tiempo real de Efectivo disponible (Cuentas 11), Margen Operativo Neto y Razón Corriente de Solvencia.
* **Consultas Financieras en Lenguaje Natural**:
  - *"¿Cuál es mi liquidez y solvencia?"*: Retorna el balance de tesorería y la razón corriente de respaldo ante pasivos inmediatos.
  - *"¿Cuánto debemos pagar de impuestos a la DIAN?"*: Proyecta el saldo de IVA por pagar (2408) y retenciones practicadas (2365).
  - *"¿Cómo está el margen y rentabilidad?"*: Entrega el P&L operacional con ingresos y costos consolidados.
  - *"¿Cuál es el estado de la cartera de clientes?"*: Resume cuentas por cobrar y recomienda estrategias de recaudo.

#### 3. Causación en Lenguaje Natural
* **Generación de Asientos por Prompt**: Permite redactar lo que ocurrió (ej. *"Pagamos $4.500.000 de arrendamiento de la oficina por transferencia Bancolombia"*).
* **Estructuración de Partida Doble**: La IA analiza el concepto, busca o crea las cuentas correspondientes en el PUC de la empresa y estructura la tabla con Débitos y Créditos balanceados ($\sum \text{Débitos} = \sum \text{Créditos}$).
* **Asentamiento Inmediato**: Un botón permite validar y postear directamente al Libro Diario general sin digitar comprobantes manualmente.

#### 4. Auditor Neuronal de Riesgos & Anomalías
* **Detección Preventiva**: Escanea los saldos de todas las cuentas activas detectando saldos en rojo en bancos/caja y facturas de clientes vencidas sin cobro.
* **Índice de Confiabilidad**: Puntaje de salud de 0 a 100 con acciones sugeridas para optimización fiscal y de tesorería.

### Modificación Técnica y Extensión
* **Añadir Nuevas Reglas de Clasificación**: En `src/lib/ai/ai-accounting-service.ts`, modificar el método `predictPucAccount(text: string)`.
* **Conectar un Modelo de Lenguaje Externo (ej. Gemini o OpenAI)**: En `src/lib/ai/ai-accounting-service.ts`, sustituir o extender las funciones `parseInvoiceText` o `queryCfoBot` consumiendo la API de inferencia deseada.

---

## Módulo 4: Facturación Electrónica DIAN & DSE

* **Ruta de acceso**: `/dashboard/billing`
* **Archivos clave**:
  - Vista: `src/app/dashboard/billing/page.tsx`
  - API: `src/app/api/invoices/route.ts`
  - Servicio DIAN: `src/lib/billing/einvoice-service.ts`, `tax-service.ts`

### Propósito
Emisión de Facturas Electrónicas de Venta bajo estándar UBL 2.1 DIAN, Documento Soporte Electrónico (DSE) y Notas Crédito/Débito.

### Utilización
1. **Generar Factura**:
   - Selecciona el cliente (Tercero).
   - Añade ítems (código, descripción, valor unitario, tarifa IVA 19%/5%/0%).
   - El sistema calcula subtotal, IVA, retefuente y total a pagar.
2. **Generar XML y CUFE**:
   - Al emitir, el sistema genera el código hash único **CUFE** (Código Único de Facturación Electrónica) basado en SHA-384 y genera el código QR reglamentario.
3. **Asiento Automático**: Contabiliza inmediatamente:
   - Débito: Clientes `130505`
   - Crédito: Ingresos por ventas `4135...`
   - Crédito: IVA Generado `240805`
   - Débito: ReteICA / ReteFuente por cobrar (si aplica).

### Modificación Técnica
* **Cambiar prefijo y resolución DIAN**:
  - Editar en `src/app/dashboard/settings/page.tsx` o en `src/lib/billing/einvoice-service.ts` los parámetros `prefix` y `resolutionNumber`.

---

## Módulo 5: Tesorería, Cartera & Flujo de Caja

* **Ruta de acceso**: `/dashboard/treasury`
* **Archivos clave**:
  - Vista: `src/app/dashboard/treasury/page.tsx`
  - API: `src/app/api/treasury/route.ts`
  - Servicio: `src/lib/treasury/cash-forecast-service.ts`

### Propósito
Control de liquidez, gestión de cuentas por cobrar (CXC) y cuentas por pagar (CXP) con matriz de antigüedad de saldos (*Aging*).

### Utilización
1. **Matriz de Antigüedad (Aging Buckets)**:
   - *Corriente*: Facturas no vencidas.
   - *Mora 1 a 30 días*, *31 a 60 días*, *61 a 90 días*, *+90 días*.
2. **Previsión de Tesorería a 30 Días**: Proyección matemática de saldo en bancos cruzando entradas esperadas de cartera vs obligaciones corrientes.
3. **Generación de Notificaciones de Cobro**: Permite emitir avisos formales de cobro para clientes con saldo vencido.

### Modificación Técnica
* Para ajustar los tramos de días o tasas de interés moratorio, editar `src/lib/treasury/cash-forecast-service.ts`.

---

## Módulo 6: Conciliación Bancaria

* **Ruta de acceso**: `/dashboard/accounting/bank`
* **Archivos clave**:
  - Vista: `src/app/dashboard/accounting/bank/page.tsx`
  - API: `src/app/api/bank/route.ts`
  - Lógica: `src/lib/accounting/bank-reconciliation.ts`

### Propósito
Verificación de coincidencia exacta entre los movimientos del extracto bancario oficial y los asientos registrados en la cuenta `111005` (Bancos Nacionales).

### Utilización
1. **Importar Movimientos del Extracto**: Registro de fecha, referencia, descripción e importe (+ o -).
2. **Cruce Automático**: El algoritmo busca coincidencias por importe, fecha (rango +/- 3 días) y referencia.
3. **Conciliar / Desmarcar**: Los movimientos que coinciden se marcan con badge verde *Conciliado*. Si hay diferencia de un solo centavo, el sistema exige ajuste contable por partidas conciliatorias.

---

## Módulo 7: Inventarios & Kardex Multi-bodega

* **Ruta de acceso**: `/dashboard/inventory`
* **Archivos clave**:
  - Vista: `src/app/dashboard/inventory/page.tsx`
  - API: `src/app/api/inventory/route.ts`
  - Servicio: `src/lib/inventory/kardex-service.ts`

### Propósito
Control de existencias multi-bodega con valuación bajo método NIIF de **Promedio Ponderado**.

### Utilización
1. **Ficha de Producto**: Registro de SKU, categoría, stock mínimo, precio de costo y venta.
2. **Entradas y Salidas de Kardex**:
   - Cada compra recalcula el costo unitario promedio ponderado.
   - Cada venta descarga existencias y asienta el costo de ventas (`Débito 6135 / Crédito 1435`).
3. **Alertas de Stock Mínimo**: Resalta productos en nivel crítico de reposición.

---

## Módulo 8: Nómina Electrónica & Seguridad Social

* **Ruta de acceso**: `/dashboard/payroll`
* **Archivos clave**:
  - Vista: `src/app/dashboard/payroll/page.tsx`
  - API: `src/app/api/payroll/route.ts`
  - Servicio: `src/lib/payroll/payroll-service.ts`

### Propósito
Liquidación de sueldos bajo legislación laboral colombiana y generación del documento de Nómina Electrónica con código **CUNE** para la DIAN.

### Utilización
1. **Novedades de Nómina**: Días laborados, horas extras diurnas/nocturnas, comisiones e incapacidades.
2. **Cálculo Automático de Deducciones**:
   - Salud empleado: 4%
   - Pensión empleado: 4%
   - Fondo de Solidaridad Pensional (si devenga > 4 SMLV).
3. **Aportes Patronales & Provisiones**:
   - Salud (8.5%), Pensión (12%), ARL (según riesgo).
   - Parafiscales: SENA (2%), ICBF (3%), Caja de Compensación (4%) - con exoneración Art. 114-1 E.T.
   - Provisiones: Cesantías (8.33%), Intereses (1%), Prima (8.33%), Vacaciones (4.17%).

---

## Módulo 9: Costos de Producción & Manufactura

* **Ruta de acceso**: `/dashboard/accounting/production`
* **Archivos clave**:
  - Vista: `src/app/dashboard/accounting/production/page.tsx`
  - APIs: `/api/production`, `/api/production/[id]/costs`
  - Lógica: `src/lib/accounting/production-costs.ts`

### Propósito
Control de órdenes de fabricación industrial acumulando los tres elementos del costo:
1. **MPD**: Materia Prima Directa (Cuenta `71`).
2. **MOD**: Mano de Obra Directa (Cuenta `72`).
3. **CIF**: Costos Indirectos de Fabricación (Cuenta `73`).

---

## Módulo 10: Cierres Contables & Bloqueo Fiscal

* **Ruta de acceso**: `/dashboard/accounting/closing`
* **Archivos clave**:
  - Vista: `src/app/dashboard/accounting/closing/page.tsx`
  - API: `src/app/api/closing/route.ts`
  - Servicio: `src/lib/accounting/closing.ts`

### Propósito
Cierre formal de fin de mes o año fiscal. Ejecuta depreciaciones, amortizaciones y bloquea la creación o edición de asientos con fecha dentro del período cerrado para garantizar inmutabilidad histórica frente a auditorías fiscales.

---

## Módulo 11: Préstamos Bancarios & Amortización

* **Ruta de acceso**: `/dashboard/accounting/loans`
* **Archivos clave**:
  - Vista: `src/app/dashboard/accounting/loans/page.tsx`
  - Lógica: `src/lib/automation/amortization.ts`

### Propósito
Simulación y control de créditos financieros bajo el sistema francés (cuota constante), discriminando abono a capital (cuenta `2105`) y gasto por intereses financieros (cuenta `5305`).

---

## Módulo 12: Activos Fijos & Depreciación NIIF

* **Ruta de acceso**: `/dashboard/assets`
* **Archivos clave**:
  - Vista: `src/app/dashboard/assets/page.tsx`
  - API: `src/app/api/assets/route.ts`
  - Servicio: `src/lib/automation/depreciation.ts`

### Propósito
Administración de bienes de propiedad, planta y equipo (PPE). Calcula la depreciación lineal mensual considerando vida útil contable y valor de rescate/salvamento.

---

## Módulo 13: Terceros (Clientes, Proveedores y Empleados)

* **Ruta de acceso**: `/dashboard/contacts`
* **Archivos clave**:
  - Vista: `src/app/dashboard/contacts/page.tsx`
  - API: `src/app/api/contacts/route.ts`

### Propósito
Padrón maestro de personas naturales y jurídicas con NIT, Dígito de Verificación (DV), tipo de régimen tributario (Responsable / No Responsable de IVA) y datos de contacto.

---

## Módulo 14: Estados Financieros NIIF (Balance, PyG, Flujo)

* **Ruta de acceso**: `/dashboard/reports`
* **Archivos clave**:
  - Vista: `src/app/dashboard/reports/page.tsx`
  - API: `src/app/api/reports/route.ts`
  - Lógica: `src/lib/reports/financial-statements.ts`

### Propósito
Emisión de informes ejecutivos bajo Norma Internacional de Información Financiera:
1. **Estado de Situación Financiera (Balance General)**: `Activo = Pasivo + Patrimonio`.
2. **Estado de Resultados Integral (PyG)**: Ingresos, Costos, Gastos y Utilidad antes de impuestos.
3. **Estado de Flujo de Efectivo**: Actividades de Operación, Inversión y Financiación.

---

## Módulo 15: Auditoría Inmutable (Blockchain SHA-256)

* **Ruta de acceso**: `/dashboard/audit`
* **Archivos clave**:
  - Vista: `src/app/dashboard/audit/page.tsx`
  - API: `src/app/api/audit/route.ts`
  - Servicio: `src/lib/system/audit-service.ts`

### Propósito
Registro forense infalsificable de cada transacción, login, modificación o anulación. Cada registro contiene el hash SHA-256 del bloque anterior, formando una cadena inalterable verificable criptográficamente.

---

## Módulo 16: Configuración del Sistema

* **Ruta de acceso**: `/dashboard/settings`
* **Archivos clave**:
  - Vista: `src/app/dashboard/settings/page.tsx`

### Propósito
Definición de parámetros empresariales (Razón social, NIT, mes de cierre, IVA por defecto, prefijo de facturación) y preferencia de tema (Claro u Oscuro Puro OLED).

---

## Módulo 17: Protección de Datos, Auditoría de Riesgos & Disaster Recovery

* **Ruta de acceso**: `/dashboard/settings` (Pestaña "Seguridad y Datos")
* **Archivos clave**:
  - Vista: `src/app/dashboard/settings/page.tsx`
  - Servicio de Respaldo Criptográfico: `src/lib/security/backup-service.ts`
  - Servicio de Diagnóstico de Riesgos: `src/lib/security/risk-audit-service.ts`
  - Endpoints API:
    - `src/app/api/security/backup/route.ts` (GET estadísticas y registro, POST generación de backup)
    - `src/app/api/security/audit-health/route.ts` (GET escaneo en tiempo real de salud contable y riesgos)
  - Hardening HTTP: `next.config.ts`

### Propósito
Garantizar la resiliencia operativa, la inmutabilidad de la información contable y el estricto cumplimiento normativo colombiano (Habeas Data Ley 1581 de 2012, conservación de libros de comercio Art. 134 D. 2649/1993 y Art. 28 Ley 962/2005, y resoluciones de facturación electrónica DIAN).

### Características Principales:
1. **Respaldo en Caliente con Firma Criptográfica SHA-256**:
   - Generación instantánea en formato JSON estructurado con volcado atómico de todos los modelos (Cuentas PUC, Asientos, Facturas, Terceros, Activos, Préstamos, etc.).
   - Cálculo automático de checksum SHA-256 para validación de no alteración ni corrupción de archivos.
   - Registro automático del evento de respaldo en la cadena de auditoría inmutable.
   - Descarga directa de emergencia de archivos tipo `Veltrix_Backup_[TIMESTAMP]_[HASH].json`.
2. **Motor de Diagnóstico y Salud Contable en Tiempo Real (Health Score 0-100%)**:
   - **Verificación de Partida Doble**: Valida matemáticamente que $\sum \text{Débitos} = \sum \text{Créditos}$ en toda la base contable histórica.
   - **Detección de Saldos Rojos Anómalos**: Alerta inmediata si cuentas de disponible (Caja 1105 o Bancos 1110) presentan saldo negativo no conciliado.
   - **Cumplimiento DIAN**: Identificación de facturas emitidas sin código CUFE o sin firma electrónica válida.
   - **Cumplimiento Habeas Data**: Detección de terceros registrados sin número de identificación tributaria (NIT/Cédula) o clasificación de persona.
3. **Seguridad Perimetral HTTP (Grado Bancario)**:
   - Encabezados estrictos configurados en el servidor: `Strict-Transport-Security` (HSTS de 2 años con subdominios y preload), `X-Frame-Options: DENY` (anti clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y supresión del header `X-Powered-By`.
4. **Política de Retención Legal y Recuperación ante Desastres (Disaster Recovery)**:
   - RPO (Recovery Point Objective): Respaldo instantáneo descargable y compatible con replicación multi-región Turso LibSQL.
   - RTO (Recovery Time Objective): Reconstrucción en menos de 5 minutos mediante script o API de importación atómica con control transaccional.
   - Garantía de retención de 10 años conforme a la legislación fiscal colombiana.

---

## 20. Guía para Desarrolladores: Cómo Modificar y Extender

### 19.1 Cómo Añadir un Nuevo Campo a un Modelo
1. Abrir `prisma/schema.prisma` y añadir el atributo al modelo correspondiente:
   ```prisma
   model Invoice {
     // ...
     purchaseOrderRef String? // Nuevo campo
   }
   ```
2. Aplicar el cambio a la base de datos:
   ```bash
   npm run db:push
   ```
3. Actualizar la interfaz en `src/app/dashboard/billing/page.tsx` agregando el input correspondiente.

### 19.2 Cómo Crear un Nuevo Módulo en la Navegación
1. Crear la carpeta y página en `src/app/dashboard/[nombre-modulo]/page.tsx`.
2. Registrar el nuevo ítem en `src/components/layout/Sidebar.tsx` dentro de la sección correspondiente en `navigationSections`.
3. Agregar el módulo a la lista `searchableModules` en `src/components/layout/Topbar.tsx` para que sea indexado en la búsqueda global (`Ctrl + K`).

### 19.3 Personalización de Temas CSS
Para ajustar tonos o contrastes, edita las variables en `src/app/globals.css`:
* `:root` para modo claro.
* `.dark` para el modo oscuro puro (OLED).

