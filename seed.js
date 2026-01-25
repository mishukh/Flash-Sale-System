const { PrismaClient } = require('@prisma/client');
const { setProductStock, redis } = require('./services/redis.service');

const prisma = new PrismaClient();

async function seed() {
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
        data: {
            email: 'test@example.com',
            password: 'hashed_secret',
        }
    });

    const INITIAL_STOCK = 100;

    const product = await prisma.product.create({
        data: {
            name: 'iPhone 16 Pro Max',
            price: 999.99,
            stock: INITIAL_STOCK
        }
    });

    await setProductStock(product.id, INITIAL_STOCK);

    console.log(`Seeded: Product ID ${product.id}`);
    console.log(`Seeded: User ID ${user.id}`);

    await prisma.$disconnect();
    redis.quit();
}

seed().catch((e) => {
    console.error(e);
    process.exit(1);
});
