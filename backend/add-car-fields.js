const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addFields() {
  try {
    console.log('Adding car fields to User table...');

    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "carModel" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "carNumber" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "transmission" TEXT`;

    console.log('✅ Car fields added successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addFields();
