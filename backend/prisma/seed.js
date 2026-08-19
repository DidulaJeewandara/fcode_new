const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const demoUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
    headline: 'Senior Software Engineer at TechCorp',
    bio: 'Passionate about building scalable web applications and mentoring junior engineers.',
    location: 'San Francisco, CA',
    skills: ['JavaScript', 'React', 'Node.js', 'System Design'],
    education: [{ school: 'MIT', degree: 'BSc', fieldOfStudy: 'Computer Science' }],
    experience: [{ title: 'Senior Software Engineer', company: 'TechCorp', description: 'Leading the platform team.' }],
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'password123',
    headline: 'Product Manager at InnovateX',
    bio: 'Turning ideas into great products, one release at a time.',
    location: 'New York, NY',
    skills: ['Product Strategy', 'Roadmapping', 'Agile'],
    education: [{ school: 'NYU', degree: 'MBA', fieldOfStudy: 'Business Administration' }],
    experience: [{ title: 'Product Manager', company: 'InnovateX', description: 'Owning the core product roadmap.' }],
  },
  {
    name: 'Carol Williams',
    email: 'carol@example.com',
    password: 'password123',
    headline: 'UX Designer at DesignHub',
    bio: 'Designing delightful, accessible user experiences.',
    location: 'Austin, TX',
    skills: ['UI Design', 'Figma', 'User Research'],
    education: [{ school: 'RISD', degree: 'BFA', fieldOfStudy: 'Design' }],
    experience: [{ title: 'UX Designer', company: 'DesignHub', description: 'Leading design for the mobile app.' }],
  },
];

const demoPosts = [
  { authorEmail: 'alice@example.com', content: 'Excited to share that our team just shipped a major performance improvement — 40% faster load times!' },
  { authorEmail: 'bob@example.com', content: 'Just wrapped up a great product discovery session with our users. Nothing beats direct customer feedback.' },
  { authorEmail: 'carol@example.com', content: 'New portfolio piece is live — a case study on redesigning onboarding flows for better retention.' },
];

async function main() {
  console.log('Seeding database...');

  const users = {};
  for (const demoUser of demoUsers) {
    const hashedPassword = await bcrypt.hash(demoUser.password, 10);
    const user = await prisma.user.upsert({
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
    users[demoUser.email] = user;

    const existingSkills = await prisma.skill.findMany({ where: { userId: user.id } });
    if (existingSkills.length === 0) {
      await prisma.skill.createMany({
        data: demoUser.skills.map((name) => ({ name, userId: user.id })),
      });
    }

    const existingEducation = await prisma.education.findMany({ where: { userId: user.id } });
    if (existingEducation.length === 0) {
      await prisma.education.createMany({
        data: demoUser.education.map((edu) => ({ ...edu, userId: user.id })),
      });
    }

    const existingExperience = await prisma.experience.findMany({ where: { userId: user.id } });
    if (existingExperience.length === 0) {
      await prisma.experience.createMany({
        data: demoUser.experience.map((exp) => ({ ...exp, userId: user.id })),
      });
    }
  }

  const alice = users['alice@example.com'];
  const bob = users['bob@example.com'];
  const carol = users['carol@example.com'];

  // Connections: Alice <-> Bob accepted, Carol -> Alice pending (lets the demo
  // account log in and immediately see something to accept/reject).
  await prisma.connection.upsert({
    where: { requesterId_receiverId: { requesterId: alice.id, receiverId: bob.id } },
    update: {},
    create: { requesterId: alice.id, receiverId: bob.id, status: 'ACCEPTED' },
  });
  await prisma.connection.upsert({
    where: { requesterId_receiverId: { requesterId: carol.id, receiverId: alice.id } },
    update: {},
    create: { requesterId: carol.id, receiverId: alice.id, status: 'PENDING' },
  });

  // Follows: everyone follows Alice.
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: bob.id, followingId: alice.id } },
    update: {},
    create: { followerId: bob.id, followingId: alice.id },
  });
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: carol.id, followingId: alice.id } },
    update: {},
    create: { followerId: carol.id, followingId: alice.id },
  });

  // Posts with likes and comments (feed + notifications look populated).
  const existingPostCount = await prisma.post.count();
  if (existingPostCount === 0) {
    for (const demoPost of demoPosts) {
      const author = users[demoPost.authorEmail];
      const post = await prisma.post.create({
        data: { content: demoPost.content, authorId: author.id },
      });

      const others = Object.values(users).filter((u) => u.id !== author.id);
      await prisma.like.createMany({
        data: others.map((u) => ({ userId: u.id, postId: post.id })),
      });
      await prisma.comment.create({
        data: {
          content: 'Great work, congrats!',
          userId: others[0].id,
          postId: post.id,
        },
      });

      for (const liker of others) {
        await prisma.notification.create({
          data: {
            recipientId: author.id,
            senderId: liker.id,
            type: 'POST_LIKE',
            message: `${liker.name} liked your post.`,
            relatedId: post.id,
          },
        });
      }
      await prisma.notification.create({
        data: {
          recipientId: author.id,
          senderId: others[0].id,
          type: 'POST_COMMENT',
          message: `${others[0].name} commented on your post.`,
          relatedId: post.id,
        },
      });
    }
  }

  // Connection-related notifications so the bell icon has content on first login.
  const existingAcceptedNotification = await prisma.notification.findFirst({
    where: { recipientId: alice.id, senderId: bob.id, type: 'CONNECTION_ACCEPTED' },
  });
  if (!existingAcceptedNotification) {
    await prisma.notification.create({
      data: {
        recipientId: alice.id,
        senderId: bob.id,
        type: 'CONNECTION_ACCEPTED',
        message: 'Bob Smith accepted your connection request.',
      },
    });
  }

  const existingNotificationForRequest = await prisma.notification.findFirst({
    where: { recipientId: alice.id, senderId: carol.id, type: 'CONNECTION_REQUEST' },
  });
  if (!existingNotificationForRequest) {
    await prisma.notification.create({
      data: {
        recipientId: alice.id,
        senderId: carol.id,
        type: 'CONNECTION_REQUEST',
        message: 'Carol Williams sent you a connection request.',
      },
    });
  }

  // A conversation with a couple of messages between Alice and Bob.
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: alice.id } } },
        { participants: { some: { userId: bob.id } } },
      ],
    },
  });
  if (!existingConversation) {
    const conversation = await prisma.conversation.create({
      data: { participants: { create: [{ userId: alice.id }, { userId: bob.id }] } },
    });
    await prisma.message.create({
      data: { content: 'Hey Bob, congrats on the launch!', senderId: alice.id, conversationId: conversation.id },
    });
    await prisma.message.create({
      data: { content: 'Thanks Alice! Excited for what is next.', senderId: bob.id, conversationId: conversation.id },
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
