const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const { claimStock, checkRateLimit, checkIdempotency, setIdempotency, getProductStock } = require('../services/redis.service');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();
const orderQueue = new Queue('orders_queue', {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
    }
});

exports.purchaseItem = async (req, res) => {
    const { userId, productId, quantity } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!userId || !productId) return res.status(400).send('Bad Request');

    if (idempotencyKey) {
        const cached = await checkIdempotency(idempotencyKey);
        if (cached) return res.json(JSON.parse(cached));
    }

    const allowed = await checkRateLimit(userId);
    if (!allowed) return res.status(429).json({ error: 'Too many requests' });

    try {
        const result = await claimStock(productId, quantity);

        if (!result) return res.status(409).json({ error: 'Stock problem' });

        orderQueue.add('process_order', { userId, productId, quantity });

        const response = { status: 'queued' };
        if (idempotencyKey) await setIdempotency(idempotencyKey, JSON.stringify(response));

        res.json(response);

    } catch (error) {
        console.error('Purchase error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getOrderStatus = async (req, res) => {
    const { userId } = req.params;
    const orders = await prisma.order.findMany({ where: { userId: parseInt(userId) } });
    res.json(orders);
};

exports.getMetrics = async (req, res) => {
    const stock = await getProductStock(1);
    const jobs = await orderQueue.getJobCounts();
    const totalOrders = await prisma.order.count();

    res.json({
        stock_remaining: parseInt(stock),
        queue_depth: jobs.waiting,
        total_processed: totalOrders
    });
};
