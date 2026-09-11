import type { PrismaClient } from "@prisma/client";

export async function consumeRateLimit(prisma: PrismaClient, key: string, limit: number) {
  const result = await prisma.$queryRaw<{ hits: number }[]>`
    INSERT INTO api_rate_limits (key, hits, expires_at) VALUES (${key}, 1, NOW() + INTERVAL '1 hour')
    ON CONFLICT (key) DO UPDATE SET
      hits = CASE WHEN api_rate_limits.expires_at <= NOW() THEN 1 ELSE LEAST(api_rate_limits.hits + 1, ${limit + 1}) END,
      expires_at = CASE WHEN api_rate_limits.expires_at <= NOW() THEN NOW() + INTERVAL '1 hour' ELSE api_rate_limits.expires_at END
    RETURNING hits`;
  return result[0].hits <= limit;
}
