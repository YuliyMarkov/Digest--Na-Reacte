import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin12345", 10);

  await prisma.user.upsert({
    where: { email: "admin@digest.uz" },
    update: {
      name: "Admin",
      passwordHash: hashedPassword,
      role: "admin",
    },
    create: {
      name: "Admin",
      email: "admin@digest.uz",
      passwordHash: hashedPassword,
      role: "admin",
    },
  });

  const categories = [
    {
      slug: "uzbekistan",
      nameRu: "Узбекистан",
      nameUz: "O‘zbekiston",
      sortOrder: 1,
      isVisible: true,
    },
    {
      slug: "world",
      nameRu: "Мир",
      nameUz: "Dunyo",
      sortOrder: 2,
      isVisible: true,
    },
    {
      slug: "auto",
      nameRu: "Авто",
      nameUz: "Avto",
      sortOrder: 3,
      isVisible: true,
    },
    {
      slug: "incidents",
      nameRu: "Происшествия",
      nameUz: "Hodisalar",
      sortOrder: 4,
      isVisible: true,
    },
    {
      slug: "science",
      nameRu: "Наука",
      nameUz: "Fan",
      sortOrder: 5,
      isVisible: true,
    },
    {
      slug: "economy",
      nameRu: "Экономика",
      nameUz: "Iqtisodiyot",
      sortOrder: 6,
      isVisible: true,
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        nameRu: category.nameRu,
        nameUz: category.nameUz,
        sortOrder: category.sortOrder,
        isVisible: category.isVisible,
      },
      create: category,
    });
  }

  console.log("Seed completed successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });