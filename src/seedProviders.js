import prisma from './lib/prisma.js';
import bcrypt from 'bcryptjs';

const password = await bcrypt.hash('Provider123!', 12);

const PLAYERS = [
  {
    firstName: 'Eran',
    lastName: 'Zahavi',
    email: 'eran.zahavi@dbell.com',
    phone: '050-1111111',
    trade: 'plumber',
    city: 'Tel Aviv',
    hourlyRate: 120,
    rating: 4.9,
    reviews: 312,
    bio: "Just like on the pitch, I always find the right pipe. 35 years experience. No job too big.",
    availability: [1,2,3,4,5],
    start: '08:00', end: '18:00',
  },
  {
    firstName: 'Yossi',
    lastName: 'Benayoun',
    email: 'yossi.benayoun@dbell.com',
    phone: '050-2222222',
    trade: 'electrician',
    city: 'Ramat Gan',
    hourlyRate: 110,
    rating: 4.8,
    reviews: 278,
    bio: "After lighting up the Premier League, now I light up your home. Fully licensed electrician.",
    availability: [1,2,3,4,5],
    start: '07:00', end: '17:00',
  },
  {
    firstName: 'Haim',
    lastName: 'Revivo',
    email: 'haim.revivo@dbell.com',
    phone: '050-3333333',
    trade: 'painter',
    city: 'Tel Aviv',
    hourlyRate: 90,
    rating: 4.7,
    reviews: 195,
    bio: "I painted the town yellow and blue my whole career. Now I will paint your walls any colour you like.",
    availability: [0,1,2,3,4,5,6],
    start: '08:00', end: '20:00',
  },
  {
    firstName: 'Avi',
    lastName: 'Nimni',
    email: 'avi.nimni@dbell.com',
    phone: '050-4444444',
    trade: 'carpenter',
    city: 'Tel Aviv',
    hourlyRate: 100,
    rating: 4.9,
    reviews: 430,
    bio: "The best left foot in Maccabi history. The best shelves in Tel Aviv. Custom furniture is my passion.",
    availability: [1,2,3,4,5],
    start: '08:00', end: '18:00',
  },
  {
    firstName: 'Gal',
    lastName: 'Alberman',
    email: 'gal.alberman@dbell.com',
    phone: '050-5555555',
    trade: 'handyman',
    city: 'Tel Aviv',
    hourlyRate: 85,
    rating: 5.0,
    reviews: 512,
    bio: "Captain on the field, captain of reliability at home. I fix anything, every time, on time.",
    availability: [1,2,3,4,5,6],
    start: '07:00', end: '19:00',
  },
  {
    firstName: 'Eyal',
    lastName: 'Berkovic',
    email: 'eyal.berkovic@dbell.com',
    phone: '050-6666666',
    trade: 'hvac',
    city: 'Herzliya',
    hourlyRate: 115,
    rating: 4.6,
    reviews: 167,
    bio: "My passes were always cool under pressure. Same with your AC. HVAC certified, 15 years experience.",
    availability: [1,2,3,4,5],
    start: '08:00', end: '17:00',
  },
  {
    firstName: 'Barak',
    lastName: 'Itzhaki',
    email: 'barak.itzhaki@dbell.com',
    phone: '050-7777777',
    trade: 'locksmith',
    city: 'Tel Aviv',
    hourlyRate: 95,
    rating: 4.8,
    reviews: 221,
    bio: "Scored big goals in the biggest moments. Now I open doors when you need it most. 24/7 emergency locksmith.",
    availability: [0,1,2,3,4,5,6],
    start: '00:00', end: '23:00',
  },
  {
    firstName: 'Elyaniv',
    lastName: 'Barda',
    email: 'elyaniv.barda@dbell.com',
    phone: '050-8888888',
    trade: 'cleaner',
    city: 'Petah Tikva',
    hourlyRate: 70,
    rating: 4.7,
    reviews: 389,
    bio: "I kept the locker room spotless after every match. Your home will shine like the championship trophy.",
    availability: [1,2,3,4,5],
    start: '08:00', end: '16:00',
  },
  {
    firstName: 'Tamir',
    lastName: 'Cohen',
    email: 'tamir.cohen@dbell.com',
    phone: '050-9999999',
    trade: 'gardener',
    city: 'Ramat HaSharon',
    hourlyRate: 75,
    rating: 4.5,
    reviews: 143,
    bio: "I grew from the Maccabi youth academy. Now I help your garden grow. Mediterranean landscapes are my specialty.",
    availability: [1,2,3,4,5,6],
    start: '06:00', end: '16:00',
  },
  {
    firstName: 'Dor',
    lastName: 'Peretz',
    email: 'dor.peretz@dbell.com',
    phone: '050-1010101',
    trade: 'pest-control',
    city: 'Tel Aviv',
    hourlyRate: 80,
    rating: 4.6,
    reviews: 98,
    bio: "I pressed opponents all over the pitch. Now I hunt down pests all over your home. No creature escapes.",
    availability: [1,2,3,4,5],
    start: '08:00', end: '18:00',
  },
  {
    firstName: 'Sheran',
    lastName: 'Yeini',
    email: 'sheran.yeini@dbell.com',
    phone: '050-1122334',
    trade: 'electrician',
    city: 'Givatayim',
    hourlyRate: 100,
    rating: 4.7,
    reviews: 156,
    bio: "Maccabi legend, reliable as always. Electrical work done right the first time, just like my tackles.",
    availability: [1,2,3,4,5],
    start: '08:00', end: '18:00',
  },
  {
    firstName: 'Ben',
    lastName: 'Sahar',
    email: 'ben.sahar@dbell.com',
    phone: '050-2233445',
    trade: 'handyman',
    city: 'Tel Aviv',
    hourlyRate: 80,
    rating: 4.4,
    reviews: 87,
    bio: "Played all over Europe before coming home. Now I bring that international expertise to your home repairs.",
    availability: [1,2,3,4,5,6],
    start: '09:00', end: '17:00',
  },
  {
    firstName: 'Tal',
    lastName: 'Banin',
    email: 'tal.banin@dbell.com',
    phone: '050-3344556',
    trade: 'plumber',
    city: 'Tel Aviv',
    hourlyRate: 95,
    rating: 4.8,
    reviews: 203,
    bio: "Goals from everywhere on the pitch. I fix leaks everywhere in your home. Fast, clean, professional.",
    availability: [1,2,3,4,5],
    start: '07:00', end: '17:00',
  },
  {
    firstName: 'Yoav',
    lastName: 'Ziv',
    email: 'yoav.ziv@dbell.com',
    phone: '050-4455667',
    trade: 'painter',
    city: 'Bnei Brak',
    hourlyRate: 85,
    rating: 4.5,
    reviews: 112,
    bio: "Kept a clean sheet on the pitch. I keep clean lines on your walls. Interior and exterior painting specialist.",
    availability: [1,2,3,4,5],
    start: '08:00', end: '17:00',
  },
  {
    firstName: 'Eden',
    lastName: 'Shamir',
    email: 'eden.shamir@dbell.com',
    phone: '050-5566778',
    trade: 'carpenter',
    city: 'Tel Aviv',
    hourlyRate: 90,
    rating: 4.6,
    reviews: 134,
    bio: "Built a career at Maccabi from the ground up. Now I build beautiful furniture from the ground up too.",
    availability: [1,2,3,4,5,6],
    start: '08:00', end: '18:00',
  },
];

async function main() {
  console.log('Seeding trades...');

  // Create all trades first
  const trades = [
    { name: 'Plumber',        slug: 'plumber',      icon: '🔧' },
    { name: 'Electrician',    slug: 'electrician',  icon: '⚡' },
    { name: 'Handyman',       slug: 'handyman',     icon: '🛠️' },
    { name: 'Painter',        slug: 'painter',      icon: '🖌️' },
    { name: 'Carpenter',      slug: 'carpenter',    icon: '🪵' },
    { name: 'HVAC Technician',slug: 'hvac',         icon: '❄️' },
    { name: 'Locksmith',      slug: 'locksmith',    icon: '🔑' },
    { name: 'Cleaner',        slug: 'cleaner',      icon: '🧹' },
    { name: 'Gardener',       slug: 'gardener',     icon: '🌱' },
    { name: 'Pest Control',   slug: 'pest-control', icon: '🐛' },
  ];

  for (const t of trades) {
    await prisma.trade.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
  }
  console.log('Trades ready!\n');

  // Create admin if not exists
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@dbell.com' } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: 'admin@dbell.com',
        password: await bcrypt.hash('Admin1234!', 12),
        firstName: 'D-Bell',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });
    console.log('Admin created: admin@dbell.com / Admin1234!\n');
  }

  console.log('Seeding Maccabi Tel Aviv providers...\n');

  for (const p of PLAYERS) {
    const existing = await prisma.user.findUnique({ where: { email: p.email } });
    if (existing) {
      console.log(`Skipping ${p.firstName} ${p.lastName} - already exists`);
      continue;
    }

    const trade = await prisma.trade.findUnique({ where: { slug: p.trade } });
    if (!trade) {
      console.log(`Trade "${p.trade}" still not found - something is wrong`);
      continue;
    }

    await prisma.user.create({
      data: {
        email: p.email,
        password,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        role: 'PROVIDER',
        provider: {
          create: {
            city: p.city,
            baseHourlyRate: p.hourlyRate,
            rating: p.rating,
            reviewCount: p.reviews,
            bio: p.bio,
            status: 'APPROVED',
            trades: { connect: [{ slug: p.trade }] },
            availability: {
              create: p.availability.map((day) => ({
                dayOfWeek: day,
                startTime: p.start,
                endTime: p.end,
                isActive: true,
              })),
            },
          },
        },
      },
    });

    console.log(`Done: ${p.firstName} ${p.lastName} - ${p.trade} in ${p.city} ($${p.hourlyRate}/hr)`);
  }

  console.log('\nAll Maccabi Tel Aviv providers are ready!');
  console.log('Password for all: Provider123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
