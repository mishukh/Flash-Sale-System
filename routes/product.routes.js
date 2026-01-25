const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

router.post('/', productController.createProduct);
router.post('/restock', productController.restock);
router.get('/', productController.getProducts);

module.exports = router;
