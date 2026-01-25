const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchase.controller');

router.get('/metrics', purchaseController.getMetrics);
router.get('/orders/:userId', purchaseController.getOrderStatus);
router.post('/', purchaseController.purchaseItem);

module.exports = router;
