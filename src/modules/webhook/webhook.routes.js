const express = require('express');
const router = express.Router();
const ctrl = require('./webhook.controller');

router.get('/',  ctrl.verifyWebhook);
router.post('/', ctrl.handleButtonReply);

module.exports = router;
