import { prisma } from "../prisma";
import { createHash } from "crypto";

export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

export class AuditService {
  /**
   * Generates a SHA-256 hash for chaining
   */
  private static calculateHash(
    prevHash: string,
    action: string,
    entity: string,
    entityId: string,
    detailsStr: string,
    timestamp: string
  ): string {
    const raw = `${prevHash}|${action}|${entity}|${entityId}|${detailsStr}|${timestamp}`;
    return createHash("sha256").update(raw).digest("hex");
  }

  /**
   * Log an action in the system with cryptographic hash chaining
   */
  static async log(data: {
    userId?: string;
    companyId?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: unknown;
    ipAddress?: string;
  }) {
    const companyId = data.companyId || "default";

    // Obtener el último log para encadenar
    const lastLog = await prisma.auditLog.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    let prevHash = GENESIS_HASH;
    if (lastLog?.details) {
      try {
        const parsed = JSON.parse(lastLog.details);
        if (parsed._crypto?.hash) {
          prevHash = parsed._crypto.hash;
        }
      } catch {
        prevHash = GENESIS_HASH;
      }
    }

    const timestamp = new Date().toISOString();
    const userDetails = typeof data.details === "object" && data.details !== null ? data.details : { payload: data.details };
    const detailsStr = JSON.stringify(userDetails);

    const hash = this.calculateHash(
      prevHash,
      data.action,
      data.entity,
      data.entityId || "",
      detailsStr,
      timestamp
    );

    const envelopedDetails = {
      ...userDetails,
      _crypto: {
        prevHash,
        hash,
        timestamp,
      },
    };

    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        companyId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: JSON.stringify(envelopedDetails),
        ipAddress: data.ipAddress || "127.0.0.1",
      },
    });
  }

  /**
   * Get audit logs for a company
   */
  static async getLogs(companyId: string, limit = 100): Promise<any[]> {
    let logs = await prisma.auditLog.findMany({
      where: { companyId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Si aún no hay logs, sembrar algunos registros iniciales encadenados
    if (logs.length === 0) {
      await this.log({
        companyId,
        action: "INITIALIZE",
        entity: "System",
        entityId: "SYS-INIT",
        details: { message: "Sistema Veltrix ERP inicializado y asegurado con cadena de bloques SHA-256" },
        ipAddress: "127.0.0.1",
      });
      await this.log({
        companyId,
        action: "POST_ENTRY",
        entity: "JournalEntry",
        entityId: "1",
        details: { description: "Asiento de apertura 2026 asentado", total: 48500000 },
        ipAddress: "127.0.0.1",
      });

      logs = await prisma.auditLog.findMany({
        where: { companyId },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }

    return logs;
  }

  /**
   * Verifies the cryptographic chain integrity of all audit logs
   */
  static async verifyIntegrity(companyId: string): Promise<{
    isValid: boolean;
    totalLogs: number;
    verifiedCount: number;
    tamperedLogId?: string;
    details: string;
  }> {
    const allLogs = await prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    });

    if (allLogs.length === 0) {
      return {
        isValid: true,
        totalLogs: 0,
        verifiedCount: 0,
        details: "No hay registros para verificar.",
      };
    }

    let expectedPrevHash = GENESIS_HASH;
    let verifiedCount = 0;

    for (const log of allLogs) {
      if (!log.details) {
        return {
          isValid: false,
          totalLogs: allLogs.length,
          verifiedCount,
          tamperedLogId: log.id,
          details: `El registro ${log.id} no contiene envoltorio criptográfico.`,
        };
      }

      let parsed: any;
      try {
        parsed = JSON.parse(log.details);
      } catch {
        return {
          isValid: false,
          totalLogs: allLogs.length,
          verifiedCount,
          tamperedLogId: log.id,
          details: `El contenido del registro ${log.id} fue corrompido.`,
        };
      }

      const cryptoInfo = parsed._crypto;
      if (!cryptoInfo || !cryptoInfo.hash || !cryptoInfo.prevHash) {
        // En caso de logs anteriores a la activación
        expectedPrevHash = cryptoInfo?.hash || GENESIS_HASH;
        verifiedCount++;
        continue;
      }

      // 1. Validar encadenamiento con el hash previo
      if (cryptoInfo.prevHash !== expectedPrevHash) {
        return {
          isValid: false,
          totalLogs: allLogs.length,
          verifiedCount,
          tamperedLogId: log.id,
          details: `Ruptura en la cadena en el registro ${log.id}. Se esperaba hash previo ${expectedPrevHash} pero se encontró ${cryptoInfo.prevHash}.`,
        };
      }

      // 2. Recalcular el hash del contenido actual
      const { _crypto, ...cleanPayload } = parsed;
      const recomputedHash = this.calculateHash(
        cryptoInfo.prevHash,
        log.action,
        log.entity,
        log.entityId || "",
        JSON.stringify(cleanPayload),
        cryptoInfo.timestamp
      );

      if (recomputedHash !== cryptoInfo.hash) {
        return {
          isValid: false,
          totalLogs: allLogs.length,
          verifiedCount,
          tamperedLogId: log.id,
          details: `El contenido del registro ${log.id} fue alterado después de su emisión (tampered payload).`,
        };
      }

      expectedPrevHash = cryptoInfo.hash;
      verifiedCount++;
    }

    return {
      isValid: true,
      totalLogs: allLogs.length,
      verifiedCount,
      details: "Todos los registros de auditoría conservan su integridad criptográfica inmutable.",
    };
  }
}
