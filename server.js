const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/products', require('./routes/product.routes'));
app.use('/purchase', require('./routes/purchase.routes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
