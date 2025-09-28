import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if test user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: 'cmg2w1nvv000277gwt71j8eqa' }
    });

    if (existingUser) {
      console.log('Test user already exists:', existingUser);
      return existingUser;
    }

    // Create test user with the exact ID referenced in the code
    const testUser = await prisma.user.create({
      data: {
        id: 'cmg2w1nvv000277gwt71j8eqa',
        email: 'test@myjarvis.local',
        name: 'Test User',
        passwordHash: 'temporary-hash', // Will be replaced with proper auth
      },
    });

    console.log('Test user created successfully:', testUser);
    return testUser;
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();