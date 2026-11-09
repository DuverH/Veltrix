/**
 * @file route.ts (API Backup & Disaster Recovery)
 * @description Endpoint para generación y consulta de copias de seguridad de Veltrix ERP.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { backupService } from "@/lib/security/backup-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/security/backup?companyId=xxx
 * Obtiene el resumen de volumen de datos y estado de respaldos.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") || (session.user as any).companyId || "default";

    // Obtener estadísticas de registros
    const [accounts, entries, invoices, contacts] = await Promise.all([
      prisma.account.count({ where: { companyId } }),
      prisma.journalEntry.count({ where: { companyId } }),
      prisma.invoice.count({ where: { companyId } }),
      prisma.contact.count({ where: { companyId } }),
    ]);

    // Buscar logs de auditoría sobre respaldos previos
    const backupLogs = await prisma.auditLog.findMany({
      where: {
        companyId,
        action: "BACKUP_GENERATED",
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      status: "success",
      companyId,
      stats: {
        accounts,
        entries,
        invoices,
        contacts,
      },
      recentBackups: backupLogs.map((log) => ({
        id: log.entityId,
        date: log.createdAt,
        details: log.details,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al consultar estado de respaldos", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/backup
 * Genera una copia de seguridad en caliente con hash de integridad SHA-256.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const companyId = body.companyId || (session.user as any).companyId || "default";
    const userId = (session.user as any).id;

    // Generar el respaldo completo
    const backup = await backupService.generateBackup(companyId, userId);

    return NextResponse.json({
      success: true,
      message: "Copia de seguridad generada y asegurada con hash SHA-256 exitosamente",
      backup,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al generar la copia de seguridad", details: error?.message },
      { status: 500 }
    );
  }
}

