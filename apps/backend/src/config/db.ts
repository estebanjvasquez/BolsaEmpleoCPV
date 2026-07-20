import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Env } from "./env";

// Hand PrismaPg the connection string directly rather than a manually
// constructed pg.Pool — Hyperdrive already pools at the network level, and a
// self-managed Pool's connection reuse doesn't survive across multiple
// sequential queries in a Workers invocation (queries past the first hang
// waiting on a connection). One PrismaClient per request, per Cloudflare's docs.
export function createPrismaClient(env: Env): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.HYPERDRIVE.connectionString });
  return new PrismaClient({ adapter });
}
