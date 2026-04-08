import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function generateRandomPassword(length: number = 16): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

async function main() {
  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "default@sophrox.de" },
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists at default@sophrox.de");
      return;
    }

    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: "default@sophrox.de",
        passwordHash: hashedPassword,
        role: "admin",
      },
    });

    console.log("\n🎉 Default Admin User Created Successfully!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📧 Email:    default@sophrox.de`);
    console.log(`🔐 Password: ${randomPassword}`);
    console.log(`👤 Role:     admin`);
    console.log(`🆔 ID:       ${admin.id}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("⚠️  Save these credentials securely!\n");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
