import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const [, , name, email, password, roleArg] = process.argv;

  const role = roleArg === "editor" ? "editor" : "admin";

  if (!name || !email || !password) {
    console.log(
      "Usage: node scripts/create-admin.js \"Name\" email@example.com password123 admin"
    );
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("User with this email already exists.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
    },
  });

  console.log("User created successfully:");
  console.log({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}

main()
  .catch((error) => {
    console.error("Failed to create user:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });