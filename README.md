# Veltrix ERP · Sistema Contable, Financiero & Tributario

<p align="center">
  <strong>Plataforma integral en la nube para la gestión contable, nómina electrónica, facturación DIAN, tesorería, inventarios y activos fijos bajo normativa colombiana (NIIF / DIAN).</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2.12-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React" />
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

## Características Principales

* **Plan Único de Cuentas (PUC)**: Jerarquía dinámica multiescala con validación estricta de partida doble en cada transacción.
* **Libro Diario & Mayor**: Asientos contables automáticos y manuales con balance de comprobación en tiempo real.
* **Facturación Electrónica DIAN**: Generación de XML UBL 2.1, cálculo de CUFE y código QR reglamentario.
* **Nómina Electrónica**: Liquidación con prestaciones sociales, seguridad social, parafiscales y generación de CUNE.
* **Inventarios & Kardex Multi-bodega**: Valuación por promedio ponderado con contabilización automática en cuentas 1405/1435.
* **Tesorería & Flujo de Caja**: Matriz de antigüedad de saldos (Aging CXC/CXP), previsión a 30 días y notificaciones de cobranza.
* **Conciliación Bancaria**: Cruce automatizado de extractos bancarios contra asientos contables con validación de diferencias.
* **Activos Fijos**: Depreciación en línea recta y registro mensual automatizado de gastos acumulados.
* **Auditoría Inmutable**: Registro de eventos del sistema asegurado mediante cadena de bloques y hashes SHA-256.
* **Cierre de Período**: Bloqueo fiscal de períodos contables cerrados para integridad histórica.

---

## Puesta en Marcha Local

### 1. Requisitos
* **Node.js**: 20.x o superior
* **NPM**: 10.x o superior

### 2. Instalación y Sembrado
```bash
# 1. Instalar dependencias
npm install

# 2. Sincronizar base de datos local SQLite
npm run db:push

# 3. Sembrar datos contables, empresa inicial y usuario administrador
npm run db:seed

# 4. Iniciar servidor de desarrollo
npm run dev
```

Abre en una nueva pestaña de tu navegador: [`http://localhost:3000`](http://localhost:3000)

> [!NOTE]
> **¿Por qué no abre al hacer clic directamente desde GitHub?**
> * **Servidor local requerido**: `localhost` hace referencia a tu propia computadora, no a un servidor en internet. Requiere que ejecutes `npm run dev` previamente en tu terminal.
> * **Seguridad de navegadores (HTTPS vs HTTP)**: GitHub se sirve bajo HTTPS. Navegadores modernos como Chrome o Edge bloquean o intentan auto-convertir a `https://localhost:3000` los enlaces `http://` abiertos desde páginas seguras, generando un error `ERR_CONNECTION_REFUSED` o de certificado. Copia y pega directamente `http://localhost:3000` en una pestaña limpia de tu navegador.
> * **Para acceder desde internet / GitHub**: Consulta la sección **Despliegue a Producción** abajo para publicar la aplicación con su propia URL pública HTTPS (ej. Vercel o Docker).

### Credenciales de Acceso Iniciales:
* **Email**: `admin@erp.com`
* **Contraseña**: `Admin2026!*` *(cifrada con bcrypt en base de datos)*

---

## Guías de Despliegue a Producción

Veltrix está optimizado para producción tanto en arquitecturas Serverless (Vercel) como en contenedores independientes (Docker / VPS / Railway).

---

### Opción A: Despliegue en Vercel + Turso DB (Recomendado)
*Ideal para alta disponibilidad global, latencia mínima, escalabilidad automática y costo cero en tiers comunitarios.*

1. **Crear base de datos en Turso (LibSQL)**:
   * Crea una cuenta gratuita en [turso.tech](https://turso.tech).
   * Crea una nueva base de datos llamada `veltrix-db`.
   * Obtén la URL (`libsql://veltrix-db-[tu-usuario].turso.io`) y genera un token (`TURSO_AUTH_TOKEN`).

2. **Aplicar migraciones y datos iniciales a Turso**:
   ```bash
   DATABASE_URL="libsql://veltrix-db-[tu-usuario].turso.io" TURSO_AUTH_TOKEN="tu_token" npm run db:push
   DATABASE_URL="libsql://veltrix-db-[tu-usuario].turso.io" TURSO_AUTH_TOKEN="tu_token" npm run db:seed
   ```

3. **Conectar en Vercel**:
   * En [vercel.com](https://vercel.com), importa el repositorio: `DuverH/Veltrix`.
   * Configura las siguientes variables de entorno:
     | Variable | Valor |
     | :--- | :--- |
     | `DATABASE_URL` | `libsql://veltrix-db-[tu-usuario].turso.io` |
     | `TURSO_AUTH_TOKEN` | *Tu token generado en Turso* |
     | `NEXTAUTH_URL` | `https://tu-dominio.vercel.app` (o tu dominio con SSL) |
     | `NEXTAUTH_SECRET` | *Generar string aleatorio seguro de 32+ caracteres* |
   * Presiona **Deploy**.

---

### Opción B: Despliegue en Servidor Propio / VPS (Docker Compose)
*Ideal para mantener total soberanía sobre los datos en servidores propios (DigitalOcean, AWS, Linode, Hetzner).*

1. **Configurar el entorno**:
   ```bash
   cp .env.example .env
   ```
   Edita `.env` y define una clave segura para `NEXTAUTH_SECRET` y tu `NEXTAUTH_URL` de producción.

2. **Compilar y levantar contenedores**:
   ```bash
   docker compose up -d --build
   ```

3. **Inicializar y sembrar la base de datos dentro del contenedor**:
   ```bash
   docker compose exec veltrix npx prisma db push
   docker compose exec veltrix node prisma/seed-data.js
   ```

4. **Configurar Reverse Proxy con SSL (Nginx + Certbot)**:
   ```nginx
   server {
       server_name veltrix.tudominio.com;
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   Genera el certificado HTTPS:
   ```bash
   sudo certbot --nginx -d veltrix.tudominio.com
   ```

---

## Monitoreo y Salud del Sistema

Veltrix incluye un endpoint de comprobación de estado para balanceadores de carga y herramientas de monitorización (Uptime Kuma, BetterStack, Datadog):

* **GET `/api/health`**
  ```json
  {
    "status": "healthy",
    "app": "Veltrix ERP",
    "version": "0.1.0",
    "timestamp": "2026-11-03T20:30:00.000Z",
    "database": "connected"
  }
  ```

---

## Scripts Disponibles

* `npm run dev`: Inicia el servidor de desarrollo local con Turbopack.
* `npm run build`: Genera la compilación optimizada de producción (Standalone).
* `npm run start`: Inicia el servidor Node.js en modo producción.
* `npm run db:push`: Aplica cambios del modelo Prisma a la base de datos sin generar migraciones SQL.
* `npm run db:seed`: Puebla la empresa, usuario administrador, catálogo de cuentas PUC y datos de prueba.
* `npm run lint`: Ejecuta el análisis estático de código con ESLint.
