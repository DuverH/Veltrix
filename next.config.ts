/**
 * @file next.config.ts
 * @description Configuración de Next.js para Veltrix ERP con endurecimiento de seguridad.
 *
 * Mejoras de protección contra riesgos:
 *   - Cabeceras de seguridad HTTP de grado bancario (HSTS, Anti-Clickjacking, Anti-Sniffing).
 *   - Política de permisos restrictiva para hardware y sensores del cliente.
 *   - Compilación standalone optimizada para contenedores Docker y despliegues serverless.
 */

import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false, // Oculta la cabecera 'x-powered-by: Next.js' para mitigar fingerprinting
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
