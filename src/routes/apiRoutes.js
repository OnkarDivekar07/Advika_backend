const express = require('express');
const router = express.Router();

const ROUTES = {
  expense:          require('@modules/expense').routes,
  user:             require('@modules/user').routes,
  product:          require('@modules/product').routes,
  transaction:      require('@modules/transaction').routes,
  repayment:        require('@modules/repayment').routes,
  finance:          require('@modules/finance').routes,
  missingItem:      require('@modules/missingItem').routes,
  qr:               require('@modules/qr').routes,
  reorder:          require('@modules/reorder').routes,
  email:            require('@modules/email').routes,
  customerCount:    require('@modules/customerCount').routes,
  purchaseOrder:    require('@modules/purchaseOrder').routes,
  supplier:         require('@modules/supplier').routes,
  webhook:          require('@modules/webhook').routes,
  ranking:          require('@modules/ranking').routes,
  threshold:        require('@modules/threshold').routes,
  inventoryPlanner: require('@modules/inventoryPlanner').routes,
};

router.use('/user',           ROUTES.user);
router.use('/products',       ROUTES.product);
router.use('/transactions',   ROUTES.transaction);
router.use('/repayments',     ROUTES.repayment);
router.use('/finance',        ROUTES.finance);
router.use('/missing-items',  ROUTES.missingItem);
router.use('/qr',             ROUTES.qr);
router.use('/reorder',        ROUTES.reorder);
router.use('/email',          ROUTES.email);
router.use('/customers',      ROUTES.customerCount);
router.use('/purchase-orders', ROUTES.purchaseOrder);
router.use('/suppliers',      ROUTES.supplier);
router.use('/webhook',        ROUTES.webhook);
router.use('/ranking',        ROUTES.ranking);
router.use('/expenses',           ROUTES.expense);
router.use('/threshold',          ROUTES.threshold);
router.use('/inventory-planner',  ROUTES.inventoryPlanner);

router.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = router;
