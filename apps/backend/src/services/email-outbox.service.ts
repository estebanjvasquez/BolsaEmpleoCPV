import type { Prisma, PrismaClient } from "@prisma/client";
import type { Env } from "../config/env";
import { createPrismaClient } from "../config/db";
import { encrypt, decrypt } from "./crypto/encryption";

export interface EmailMessage { to: string; subject: string; html: string; text: string }

export async function enqueueEmail(prisma: Prisma.TransactionClient, env: Env, message: EmailMessage, options: { dedupeKey?: string; contactId?: string } = {}) {
  const data = { payloadEncrypted: await encrypt(JSON.stringify(message), env.ENCRYPTION_KEY), ...options };
  if (options.dedupeKey) return prisma.emailJob.upsert({ where: { dedupeKey: options.dedupeKey }, create: data, update: {} });
  return prisma.emailJob.create({ data });
}

export async function processEmailJob(prisma: PrismaClient, env: Env, id: string): Promise<void> {
  // Atomic lease prevents overlapping requests/cron runs from sending the same job.
  const lease = await prisma.emailJob.updateMany({
    where: { id, status: { in: ["queued", "processing"] }, nextAttemptAt: { lte: new Date() }, attempts: { lt: 5 } },
    data: { status: "processing", nextAttemptAt: new Date(Date.now() + 5 * 60_000), attempts: { increment: 1 } },
  });
  if (lease.count !== 1) return;
  const job = await prisma.emailJob.findUniqueOrThrow({ where: { id } });
  try {
    if (job.contactId) {
      const contact = await prisma.contactLog.findFirst({ where: { id: job.contactId, status: "pending_admin", company: { isActive: true, isVerified: true }, professional: { isActive: true, emailVerified: true, status: "approved" } }, select: { id: true } });
      if (!contact) { await prisma.emailJob.update({ where: { id }, data: { status: "cancelled", payloadEncrypted: "" } }); return; }
    }
    const message = JSON.parse(await decrypt(job.payloadEncrypted, env.ENCRYPTION_KEY)) as EmailMessage;
    const result = await env.EMAIL.send({ ...message, from: { email: env.EMAIL_FROM, name: "Bolsa de Talento CPV" } });
    await prisma.$transaction(async (tx) => {
      await tx.emailJob.update({ where: { id }, data: { status: "accepted", acceptedAt: new Date(), providerId: result.messageId, payloadEncrypted: "" } });
      if (job.contactId) await tx.contactLog.updateMany({ where: { id: job.contactId, status: "pending_admin" }, data: { status: "sent" } });
    });
  } catch {
    // No recipient, message, token or provider error is written to application logs.
    await prisma.emailJob.update({ where: { id }, data: { status: job.attempts >= 5 ? "failed" : "queued", nextAttemptAt: new Date(Date.now() + Math.pow(2, job.attempts) * 60_000) } });
    console.error(JSON.stringify({ event: "email_attempt_failed", jobId: id, attempt: job.attempts }));
  }
}

export async function processEmailQueue(env: Env) {
  const prisma = createPrismaClient(env);
  await prisma.$executeRaw`DELETE FROM api_rate_limits WHERE expires_at < NOW() - INTERVAL '1 day'`;
  await prisma.emailJob.updateMany({ where: { status: "processing", attempts: { gte: 5 }, nextAttemptAt: { lte: new Date() } }, data: { status: "failed" } });
  const jobs = await prisma.emailJob.findMany({ where: { status: { in: ["queued", "processing"] }, nextAttemptAt: { lte: new Date() }, attempts: { lt: 5 } }, orderBy: { createdAt: "asc" }, take: 20, select: { id: true } });
  for (const job of jobs) await processEmailJob(prisma, env, job.id);
}
