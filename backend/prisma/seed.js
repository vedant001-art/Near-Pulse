const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for NearPulse (Vaibhav & Vedant only)...');

  // Clean existing data
  await prisma.savedAmenity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.amenityImage.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Service Provider: Vaibhav Rakhede
  const provider = await prisma.user.create({
    data: {
      name: 'Vaibhav Rakhede',
      email: 'vaibhav@nearpulse.com',
      passwordHash,
      role: 'SERVICE_PROVIDER',
      phone: '+91 9820112233',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Verified Service Provider on NearPulse platform.'
    }
  });

  // 2. Student / Professional: Vedant
  const student = await prisma.user.create({
    data: {
      name: 'Vedant',
      email: 'vedant@nearpulse.com',
      passwordHash,
      role: 'STUDENT_PROFESSIONAL',
      phone: '+91 9876543210',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      bio: 'Student & Resident using NearPulse to find local services.'
    }
  });

  console.log('✅ Seeding completed:');
  console.log(`   Provider: ${provider.name} (${provider.email}) - password: password123`);
  console.log(`   Student:  ${student.name} (${student.email}) - password: password123`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
