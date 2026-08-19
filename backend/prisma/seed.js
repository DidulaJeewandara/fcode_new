const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const demoUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
    headline: 'Senior Software Engineer at TechCorp',
    bio: 'Passionate about building scalable web applications.',
    location: 'San Francisco, CA',
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'password123',
    headline: 'Product Manager at InnovateX',
    bio: 'Turning ideas into great products.',
    location: 'New York, NY',
  },
  {
    name: 'Carol Williams',
    email: 'carol@example.com',
    password: 'password123',
    headline: 'UX Designer at DesignHub',
    bio: 'Designing delightful user experiences.',
    location: 'Austin, TX',
  },
];

async function main() {
  console.log('Seeding database...');

  for (const demoUser of demoUsers) {
    const hashedPassword = await bcrypt.hash(demoUser.password, 10);
    await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {},
      create: {
        name: demoUser.name,
        email: demoUser.email,
        password: hashedPassword,
        headline: demoUser.headline,
        bio: demoUser.bio,
        location: demoUser.location,
      },
    });
  }

  console.log('Seeding complete. Demo users created:');
  demoUsers.forEach((u) => console.log(`  - ${u.email} / ${u.password}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
