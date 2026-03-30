const webhookService = require('./webhook.service');
const CustomError = require('@utils/customError');

exports.handleButtonReply = async (req, res, next) => {
  try {
    await webhookService.handleButtonReply(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(500);
  }
};

exports.verifyWebhook = (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const result = webhookService.verifyWebhook(mode, token, challenge);
  if (result) {
    res.status(200).send(result);
  } else {
    res.sendStatus(403);
  }
};
