import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@digest.uz";
  const newPassword = "S@shaY@ndex2026";

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  console.log("Password updated successfully");
}

main()
  .catch((error) => {
    console.error("Failed to update password:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });