const { PrismaClient } = require('@prisma/client');
const { setProductStock } = require('../services/redis.service');

const prisma = new PrismaClient();

exports.createProduct = async (req, res) => {
    const { name, price, stock } = req.body;
    const product = await prisma.product.create({ data: { name, price, stock } });
    await setProductStock(product.id, stock);
    res.json(product);
};

exports.getProducts = async (req, res) => {
    const products = await prisma.product.findMany();
    res.json(products);
};
