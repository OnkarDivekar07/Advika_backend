/**
 * @swagger
 * tags:
 *   name: Webhook
 *   description: WhatsApp Business webhook — supplier button replies
 */

/**
 * @swagger
 * /api/webhook:
 *   get:
 *     summary: WhatsApp webhook verification (called by Meta)
 *     tags: [Webhook]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *           example: subscribe
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *           example: my_secret_verify_token
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns hub.challenge if token matches
 *       403:
 *         description: Token mismatch
 *   post:
 *     summary: Receive supplier button reply from WhatsApp
 *     tags: [Webhook]
 *     security: []
 *     description: |
 *       Called by Meta when a supplier taps AVAILABLE or NOT_AVAILABLE on a WhatsApp message.
 *       - AVAILABLE → marks item as available
 *       - NOT_AVAILABLE → marks item as not_available, creates a new item row for the next
 *         supplier in priority order, and immediately sends them a WhatsApp message.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Standard WhatsApp webhook payload from Meta
 *     responses:
 *       200:
 *         description: Processed successfully
 *       500:
 *         description: Internal error during processing
 */
