# Veltrix ERP · Plataforma Contable, Financiera & Tributaria

<p align="center">
  <strong>Sistema ERP empresarial Full-Stack de alto rendimiento para gestión contable bajo normativa NIIF, facturación electrónica DIAN UBL 2.1, nómina electrónica, tesorería, kardex multi-bodega y auditoría criptográfica.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Author-Duver%20H.-indigo?style=flat-square&logo=github" alt="Author" />
  <img src="https://img.shields.io/badge/Next.js-16.2.12-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-7.9-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/LibSQL-Turso-00E599?style=flat-square" alt="LibSQL" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDuverH%2FVeltrix">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
</p>

---

## 👨‍💻 Sobre el Proyecto y Perfil Técnico

**Veltrix ERP** es un proyecto desarrollado por **[Duver H.](https://github.com/DuverH)** como muestra de ingeniería de software full-stack avanzada, diseñado para resolver la complejidad contable, tributaria y operativa de empresas bajo legislación colombiana e internacional (NIIF / IFRS).

El sistema implementa patrones arquitectónicos modernos, alta cohesión, bajo acoplamiento y control transaccional estricto para garantizar que nunca ocurra descuadre en libros contables.

### Decisiones de Arquitectura e Ingeniería:
* **Arquitectura de Componentes Híbrida**: Aprovechamiento de **React Server Components (RSC)** en Next.js 16 para fetching de datos en el servidor a latencia cero y renderizado estático de dashboards, combinados con Client Components interactivos en islas reactivas.
* **Control Transaccional ACID**: Validación matemática rigurosa en capa de servicio (`\sum \text{Débitos} = \sum \text{Créditos}`) antes de asentar cualquier comprobante en la base de datos.
* **Base de Datos Distribuida (LibSQL / Turso)**: Compatibilidad total con SQLite local para desarrollo rápido sin dependencias pesadas, y migración transparente a LibSQL distribuido en el Edge (Turso AWS us-east-1) para producción de alta disponibilidad.
* **Seguridad y Trazabilidad Criptográfica**: Cadena de auditoría inmutable (Blockchain-style log) donde cada registro genera un hash SHA-256 encadenado al evento anterior, detectando manipulaciones no autorizadas.
* **Diseño Responsivo Táctil**: Sistema de navegación con Drawer contextual deslizable (`cubic-bezier`), soporte táctil nativo sin retraso (`touch-action: manipulation`), tema Dual (Claro Corporativo y Oscuro Puro OLED) con CSS Variables dinámicas.

---

## 🚀 Módulos Funcionales Implementados

### 1. Núcleo Contable & NIIF
* **Plan Único de Cuentas (PUC)**: Jerarquía dinámica multiescala (Clase, Grupo, Cuenta, Subcuenta) con catálogo oficial precargado de 55+ cuentas.
* **Libro Diario & Mayor**: Registro de asientos de ajuste, apertura, compras y ventas con balance de comprobación en tiempo real.
* **Cierre de Período**: Bloqueo fiscal de meses cerrados para garantizar inmutabilidad histórica frente a auditorías fiscales.

### 2. Facturación Electrónica DIAN & UBL 2.1
* Generación del documento XML estandarizado UBL 2.1.
* Algoritmo de cálculo de **CUFE** (Código Único de Factura Electrónica) con algoritmo SHA-384.
* Generación de código QR reglamentario con URL oficial de consulta tributaria.
* Soporte para Documento Soporte Electrónico (DSE) y Notas Crédito/Débito.

### 3. Automatización Contable & Algoritmos NLP
* **Extractor Heurístico de Facturas (OCR / UBL 2.1)**: Reconocimiento inteligente de emisor, NIT, número de factura, fecha, subtotal, IVA (19%) y retención en la fuente (2.5%).
* **Mapeo Predictivo PUC**: Clasificación taxonómica de conceptos de gasto a subcuentas NIIF con índice de confianza porcentual.
* **Causación en Lenguaje Natural**: Motor semántico que transforma descripciones cotidianas en asientos contables balanceados de partida doble.
* **Auditoría Preventiva de Riesgos**: Detección temprana de cuentas en descubierto (saldo rojo) y facturas en mora.

### 4. Nómina Electrónica & Seguridad Social
* Liquidación automatizada de sueldos, auxilio de transporte y horas extras.
* Deducciones de ley: Salud (4%), Pensión (4%).
* Aportes patronales y provisiones prestacionales: Cesantías (8.33%), Intereses (1%), Prima (8.33%), Vacaciones (4.16%), ARL y Parafiscales (SENA, ICBF, Caja de Compensación).
* Generación de código **CUNE** (Código Único de Nómina Electrónica).

### 5. Inventarios, Kardex & Producción
* Control multi-bodega con método de valuación por **Promedio Ponderado**.
* Costeo en tres elementos para órdenes industriales: Materia Prima Directa (MPD), Mano de Obra Directa (MOD) y Costos Indirectos de Fabricación (CIF).
* Contabilización automática en cuentas 14 (Inventarios) y 61 (Costo de Ventas).

### 6. Tesorería & Conciliación Bancaria
* Matriz de antigüedad de saldos (Aging CXC / CXP) a 30, 60 y 90 días.
* Previsión de flujo de caja libre a 30 días.
* Motor de cruce automatizado entre extractos bancarios y movimientos de la cuenta 1110 (Bancos).

### 7. Centro de Seguridad y Respaldo
* Generador de copias de seguridad atómicas descargables en formato JSON criptográfico con verificación SHA-256.
* Monitor de salud contable con puntaje de resiliencia (Health Score 0-100%).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Framework Full-Stack** | Next.js 16.2.12 (App Router) | Renderizado híbrido (SSR, RSC, API Routes), Turbopack |
| **Librería UI** | React 19.2.4 | Arquitectura modular basada en hooks y concurrencia |
| **Lenguaje** | TypeScript 5.x | Tipado estático estricto de extremo a extremo |
| **Estilos & Diseño** | Tailwind CSS v4 + Lucide Icons | Tokens CSS nativos, Modo Oscuro OLED, diseño responsive |
| **ORM & Modelado** | Prisma 7.9.1 | Abstracción de modelos relacionales, migrations y seeds |
| **Base de Datos** | LibSQL / Turso + SQLite | Compatibilidad Edge distribuida y persistencia ACID |
| **Autenticación** | NextAuth v4 (JWT Strategy) | Sesiones seguras, hashing bcrypt y protección de rutas |
| **Gráficos & BI** | Recharts 3.10 | Métricas de rendimiento financiero y flujo de caja |

---

## 💻 Puesta en Marcha Local

### 1. Prerrequisitos
* **Node.js**: Versión 20.x o superior
* **NPM**: Versión 10.x o superior

### 2. Instalación Paso a Paso
```bash
# 1. Clonar el repositorio
git clone https://github.com/DuverH/Veltrix.git
cd Veltrix/erp-contable

# 2. Instalar dependencias
npm install

# 3. Inicializar esquema de base de datos local SQLite
npm run db:push

# 4. Sembrar catálogo PUC, empresa y usuario administrador inicial
npm run db:seed

# 5. Iniciar servidor de desarrollo con Turbopack
npm run dev
```

Ingresa en tu navegador a: [`http://localhost:3000`](http://localhost:3000)

### Credenciales de Acceso por Defecto:
* **Usuario**: `admin@erp.com`
* **Contraseña**: `Admin2026!*` *(cifrada con bcrypt)*

---

## ☁️ Despliegue en Producción

### Opción A: Despliegue en Vercel + Turso Cloud Database (Recomendado)

1. **Crear base de datos en Turso (LibSQL)**:
   * Regístrate en [turso.tech](https://turso.tech).
   * Crea una base de datos: `veltrix-db`.
   * Copia la URL (`libsql://...`) y genera un token con `turso db tokens create veltrix-db`.

2. **Migrar esquema y datos a Turso**:
   ```bash
   # Configura las variables en tu .env o terminal y ejecuta:
   npm run db:turso
   ```

3. **Importar y desplegar en Vercel**:
   * En [vercel.com](https://vercel.com), importa el repositorio: `DuverH/Veltrix`.
   * Configura las siguientes variables de entorno:
     | Variable | Valor |
     | :--- | :--- |
     | `DATABASE_URL` | `libsql://veltrix-db-[tu-usuario].turso.io` |
     | `TURSO_AUTH_TOKEN` | *Token generado en Turso* |
     | `NEXTAUTH_URL` | `https://tu-dominio.vercel.app` (o tu dominio personalizado) |
     | `NEXTAUTH_SECRET` | *Cadena criptográfica aleatoria segura de 32+ caracteres* |
   * Haz clic en **Deploy**.

---

### Opción B: Despliegue en Servidor Dedicado / VPS (Docker Compose)

```bash
# 1. Configurar variables de entorno
cp .env.example .env

# 2. Levantar el contenedor de producción
docker compose up -d --build

# 3. Aplicar base de datos y datos dentro del contenedor
docker compose exec veltrix npx prisma db push
docker compose exec veltrix node prisma/seed-data.js
```

---

## 📈 Monitoreo y Endpoint de Salud

Veltrix cuenta con un endpoint REST público para comprobaciones de salud en balanceadores de carga y herramientas de observabilidad (Datadog, New Relic, BetterStack):

* **GET `/api/health`**
```json
{
  "status": "healthy",
  "app": "Veltrix ERP",
  "version": "0.1.0",
  "timestamp": "2026-11-09T22:00:00.000Z",
  "database": "connected"
}
```

---

## 📜 Comandos Disponibles

* `npm run dev`: Inicia el servidor de desarrollo local con Turbopack en el puerto 3000.
* `npm run build`: Compila la aplicación optimizada para producción (Next.js Standalone).
* `npm run start`: Inicia el servidor optimizado en modo producción.
* `npm run db:push`: Sincroniza el esquema de Prisma con SQLite local.
* `npm run db:turso`: Aplica el DDL completo y migra los datos de inicialización a Turso LibSQL Cloud.
* `npm run db:seed`: Puebla el PUC contable, empresa y credenciales iniciales.
* `npm run lint`: Ejecuta el linter estático ESLint para validación de código.

---

## 👤 Autor

**Duver H.**  
*Full Stack Software Developer*  
* GitHub: [@DuverH](https://github.com/DuverH)  
* Proyecto: [Veltrix ERP en GitHub](https://github.com/DuverH/Veltrix)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
