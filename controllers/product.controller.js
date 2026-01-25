const { PrismaClient } = require('@prisma/client');
const { setProductStock, restockProduct } = require('../services/redis.service');

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

exports.restock = async (req, res) => {
    const { productId, amount } = req.body;
    await prisma.product.update({ where: { id: productId }, data: { stock: { increment: amount } } });
    const newStock = await restockProduct(productId, amount);
    res.json({ id: productId, newStock });
};
