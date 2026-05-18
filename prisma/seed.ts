const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@cpdhub.co.ke' },
    update: {
      passwordHash: adminPassword,
    },
    create: {
      fullName: 'Chief Admin',
      email: 'admin@cpdhub.co.ke',
      passwordHash: adminPassword,
      role: 'Admin',
      country: 'Kenya',
    },
  });

  const professions = [
    'Lawyer',
    'Engineer',
    'Quantity Surveyor',
    'Hospitality Professional',
  ];

  console.log('Seeding professions...');
  for (const name of professions) {
    await prisma.profession.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const lawyerProf = await prisma.profession.findUnique({ where: { name: 'Lawyer' } });

  if (lawyerProf) {
    console.log('Seeding a sample course...');
    await prisma.course.create({
      data: {
        title: 'Legal Ethics & Professional Conduct in Kenya',
        description: 'A comprehensive guide to the ethical standards for legal practitioners in Kenya.',
        price: 50.0,
        cpdPoints: 5,
        professionId: lawyerProf.id,
        modules: {
          create: [
            {
              title: 'Introduction to Legal Ethics',
              order: 1,
              lessons: {
                create: [
                  {
                    title: 'The Role of the Advocate',
                    contentType: 'Video',
                    contentUrl: 'https://example.com/video1',
                    order: 1,
                  },
                ],
              },
              quizzes: {
                create: [
                  {
                    title: 'Ethics Basics Quiz',
                    passMark: 70,
                    questions: {
                      create: [
                        {
                          text: 'An advocate must always maintain client confidentiality.',
                          type: 'TrueFalse',
                          options: JSON.stringify(['True', 'False']),
                          correctAnswer: 'True',
                        },
                        {
                          text: 'Who regulates the legal profession in Kenya?',
                          type: 'MultipleChoice',
                          options: JSON.stringify(['LSK', 'KRA', 'Parliament', 'UN']),
                          correctAnswer: 'LSK',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
        quizzes: {
          create: [
            {
              title: 'Final Course Assessment',
              passMark: 80,
              questions: {
                create: [
                  {
                    text: 'Legal professionals in Kenya are bound by the Advocates Act.',
                    type: 'TrueFalse',
                    options: JSON.stringify(['True', 'False']),
                    correctAnswer: 'True',
                  },
                  {
                    text: 'The primary duty of an advocate is to the client.',
                    type: 'TrueFalse',
                    options: JSON.stringify(['False', 'True']),
                    correctAnswer: 'False',
                  },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // Create learner user
  const learnerPassword = await bcrypt.hash('password123', 12);
  const lawyerProfRecord = await prisma.profession.findUnique({ where: { name: 'Lawyer' } });
  
  if (lawyerProfRecord) {
    await prisma.user.upsert({
      where: { email: 'jane@example.com' },
      update: {
        passwordHash: learnerPassword,
      },
      create: {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: learnerPassword,
        role: 'Learner',
        country: 'Kenya',
        professionId: lawyerProfRecord.id,
      },
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
