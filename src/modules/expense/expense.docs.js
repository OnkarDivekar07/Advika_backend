/**
 * @swagger
 * tags:
 *   name: expenses
 *   description: Expense management
 */

/**
 * @swagger
 * /api/expenses/:
 *   get:
 *     summary: Get all expenses with optional date / type filters
 *     tags: [expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         example: "2026-04-01"
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         example: "2026-04-30"
 *       - in: query
 *         name: expense_type
 *         schema:
 *           type: string
 *           enum: [purchase, transport, miscellaneous]
 *       - in: query
 *         name: supplier_id
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Expenses fetched
 *
 *   post:
 *     summary: Create a new expense
 *     tags: [expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [expense_type, description, payment_method]
 *             properties:
 *               expense_type:
 *                 type: string
 *                 enum: [purchase, transport, miscellaneous]
 *               description:
 *                 type: string
 *               payment_method:
 *                 type: string
 *                 enum: [cash, online]
 *               total_bill:
 *                 type: number
 *                 description: Purchase lump-sum mode
 *               unit_cost:
 *                 type: number
 *                 description: Transport/misc amount OR purchase itemised mode
 *               quantity:
 *                 type: integer
 *                 description: Required with unit_cost for itemised purchase
 *               supplier_id: { type: string, format: uuid }
 *               notes: { type: string }
 *               expense_date: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Expense created
 */

/**
 * @swagger
 * /api/expenses/summary:
 *   get:
 *     summary: Get today and this month expense summary
 *     tags: [expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expense summary fetched
 */

/**
 * @swagger
 * /api/expenses/profit-loss:
 *   get:
 *     summary: Get P&L report for a date range
 *     tags: [expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: P&L fetched
 */

/**
 * @swagger
 * /api/expenses/balance-sheet:
 *   get:
 *     summary: Get real-time balance sheet
 *     tags: [expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Balance sheet fetched
 */

/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Update an expense
 *     tags: [expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description: { type: string }
 *               expense_type: { type: string, enum: [purchase, transport, miscellaneous] }
 *               payment_method: { type: string, enum: [cash, online] }
 *               total_bill: { type: number }
 *               unit_cost: { type: number }
 *               quantity: { type: integer }
 *               supplier_id: { type: string, format: uuid }
 *               notes: { type: string }
 *               expense_date: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Expense updated
 *       404:
 *         description: Expense not found
 *
 *   delete:
 *     summary: Delete an expense
 *     tags: [expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Expense deleted
 *       404:
 *         description: Expense not found
 */
