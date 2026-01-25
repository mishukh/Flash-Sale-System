const { Worker } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

const orderWorker = new Worker('orders_queue', async (job) => {
    const { userId, productId, quantity } = job.data;

    await prisma.$transaction(async (tx) => {
        await tx.product.update({
            where: { id: productId },
            data: { stock: { decrement: quantity } },
        });

        await tx.order.create({
            data: { userId, productId, quantity, status: 'CONFIRMED' }
        });
    });
}, { connection: { host: 'localhost', port: 6379 } });

module.exports = orderWorker;
