import { PrismaClient, UserRole } from '../../apps/api/src/generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@roznamcha.local' },
    update: {},
    create: {
      email: 'admin@roznamcha.local',
      name: 'Admin',
      role: UserRole.ADMIN,
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@roznamcha.local' },
    update: {},
    create: {
      email: 'manager@roznamcha.local',
      name: 'Manager',
      role: UserRole.MANAGER,
      passwordHash: await bcrypt.hash('manager123', 10),
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@roznamcha.local' },
    update: {},
    create: {
      email: 'staff@roznamcha.local',
      name: 'Staff',
      role: UserRole.STAFF,
      passwordHash: await bcrypt.hash('staff123', 10),
    },
  });

  await prisma.cashAccount.upsert({
    where: { id: 'main' },
    update: {},
    create: { id: 'main', balance: 0 },
  });

  const customer = await prisma.customer.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Ahmed Khan',
      phone: '03001234567',
      address: 'Main Bazaar',
    },
  });

  await prisma.customer.upsert({
    where: { id: '00000000-0000-4000-8000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000011',
      name: 'Bilal Timber Works',
      phone: '03009876543',
    },
  });

  const supplier = await prisma.supplier.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      name: 'City Timber Depot',
      phone: '03007654321',
    },
  });

  await prisma.supplier.upsert({
    where: { id: '00000000-0000-4000-8000-000000000012' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000012',
      name: 'Northern Wood Traders',
      phone: '03111222333',
    },
  });

  const sheesham = await prisma.product.upsert({
    where: { id: '00000000-0000-4000-8000-000000000021' },
    update: {
      name: 'Sheesham',
      unit: 'cft',
      salePrice: 280,
      purchasePrice: 220,
      isActive: true,
    },
    create: {
      id: '00000000-0000-4000-8000-000000000021',
      name: 'Sheesham',
      unit: 'cft',
      salePrice: 280,
      purchasePrice: 220,
    },
  });

  const teak = await prisma.product.upsert({
    where: { id: '00000000-0000-4000-8000-000000000022' },
    update: {
      name: 'Teak',
      unit: 'cft',
      salePrice: 450,
      purchasePrice: 380,
      isActive: true,
    },
    create: {
      id: '00000000-0000-4000-8000-000000000022',
      name: 'Teak',
      unit: 'cft',
      salePrice: 450,
      purchasePrice: 380,
    },
  });

  const pine = await prisma.product.upsert({
    where: { id: '00000000-0000-4000-8000-000000000023' },
    update: {
      name: 'Pine',
      unit: 'cft',
      salePrice: 120,
      purchasePrice: 90,
      isActive: true,
    },
    create: {
      id: '00000000-0000-4000-8000-000000000023',
      name: 'Pine',
      unit: 'cft',
      salePrice: 120,
      purchasePrice: 90,
    },
  });

  console.log('Seed complete — Wood Trading');
  console.log({
    admin: admin.email,
    customer: customer.name,
    supplier: supplier.name,
    products: [sheesham.name, teak.name, pine.name],
  });
  console.log('Login: admin@roznamcha.local / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
