import bcrypt from "bcrypt";
import prisma from "./src/lib/prisma.js"; // ← ВАЖНО

async function main() {
  const email = "admin@digest.uz";
  const newPassword = "НОВЫЙ_ПАРОЛЬ";

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