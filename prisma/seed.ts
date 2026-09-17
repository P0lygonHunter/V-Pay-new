import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to run the seed script with NODE_ENV=production. " +
        "This creates a demo user with a fake balance — never run it against a real database."
    );
  }

  const pinHash = await bcrypt.hash("1234", 12);

  const demo = await prisma.user.upsert({
    where: { phone: "+923001234567" },
    update: {},
    create: {
      phone: "+923001234567",
      name: "Ahmed Khan",
      accountNumber: "0300000001",
      balance: 248650,
      currency: "PKR",
      pinHash,
      isVerified: true,
    },
  });

  console.log(`Seeded demo user: ${demo.id} (${demo.phone})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
