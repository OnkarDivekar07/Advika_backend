const express = require('express');
const router = express.Router();
const ctrl = require('./ranking.controller');
const authenticate = require('@middlewares/authenticate');
const authorizeAdmin = require('@middlewares/authorizeAdmin');

// GET /api/ranking        — all products sorted by rank (rank 1 = top seller)
router.get('/', authenticate, authorizeAdmin, ctrl.getRankings);

// GET /api/ranking/categories — split into fast / slow / non-moving buckets
router.get('/categories', authenticate, authorizeAdmin, ctrl.getRankingsByCategory);

router.get('/inventory-distribution',authenticate, authorizeAdmin, ctrl.getInventoryDistribution);


// DELETE /api/ranking/reset — reset all salesCounts and ranks to zero (admin only)
router.delete('/reset', authenticate, authorizeAdmin, ctrl.resetRankings);



module.exports = router;
