import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const exists = await prisma.user.findUnique({ where: { login: 'superadmin' } });
  if (exists) {
    console.log('Already seeded');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123', salt);

  const superadmin = await prisma.user.create({
    data: {
      name: 'Superadmin User',
      login: 'superadmin',
      passwordHash,
      phone: '+998901234567',
      role: 'superadmin',
      isActive: true
    }
  });

  console.log('Seeded successfully:', superadmin.login);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
