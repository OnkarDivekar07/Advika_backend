/**
 * @swagger
 * tags:
 *   name: Missing Items
 *   description: Track items customers asked for that were out of stock
 */

/**
 * @swagger
 * /api/missing-items:
 *   get:
 *     summary: Get all missing items
 *     tags: [Missing Items]
 *     responses:
 *       200:
 *         description: List of missing items
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MissingItem'
 *   post:
 *     summary: Log a missing item
 *     tags: [Missing Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sunflower
 *     responses:
 *       201:
 *         description: Missing item created
 *       422:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/missing-items/{id}:
 *   get:
 *     summary: Get a single missing item
 *     tags: [Missing Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Missing item record
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update a missing item (name or requestCount)
 *     tags: [Missing Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               requestCount: { type: integer }
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a missing item
 *     tags: [Missing Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
