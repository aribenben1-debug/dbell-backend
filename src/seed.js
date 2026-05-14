import prisma from './lib/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  // Trades
  const trades = [
    { name: 'Plumber', slug: 'plumber', icon: '🔧' },
    { name: 'Electrician', slug: 'electrician', icon: '⚡' },
    { name: 'Handyman', slug: 'handyman', icon: '🛠️' },
    { name: 'Painter', slug: 'painter', icon: '🖌️' },
    { name: 'Carpenter', slug: 'carpenter', icon: '🪵' },
    { name: 'HVAC Technician', slug: 'hvac', icon: '❄️' },
    { name: 'Locksmith', slug: 'locksmith', icon: '🔑' },
    { name: 'Cleaner', slug: 'cleaner', icon: '🧹' },
    { name: 'Gardener', slug: 'gardener', icon: '🌱' },
    { name: 'Pest Control', slug: 'pest-control', icon: '🐛' },
  ];
  await prisma.trade.createMany({ data: trades, skipDuplicates: true });

  // Admin user
  const adminEmail = 'admin@dbell.com';
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!exists) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: await bcrypt.hash('Admin1234!', 12),
        firstName: 'D-Bell',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });
    console.log('Admin created: admin@dbell.com / Admin1234!');
  }

  console.log('Seed complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());
