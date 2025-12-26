import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create Super Admin
    const superAdminPassword = await bcrypt.hash('Admin123!', 10);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@system.com' },
        update: {},
        create: {
            email: 'admin@system.com',
            password: superAdminPassword,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            permissions: [],
        },
    });

    console.log('✅ Super Admin created:', {
        email: 'admin@system.com',
        password: 'Admin123!',
        name: 'Super Admin',
    });

    console.log('\n🎉 Seeding completed!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@system.com');
    console.log('   Password: Admin123!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
