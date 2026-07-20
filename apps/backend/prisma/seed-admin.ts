import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// One-off bootstrap for the first admin account. Admins are never
// self-registered (implementation_plan.md §11 assumes JWT-authenticated
// admin routes with no public sign-up) — run this manually, once, with:
//   ADMIN_USERNAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npx tsx prisma/seed-admin.ts
const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !email || !password) {
    throw new Error("Set ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD env vars before running this script.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    create: { username, email, passwordHash, role: "superadmin" },
    update: { passwordHash },
    select: { id: true, username: true, email: true, role: true },
  });

  console.log(`Admin ready: ${admin.username} <${admin.email}> (${admin.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
