/**
 * @swagger
 * tags:
 *   name: expenses
 *   description: Expense management
 */

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get expenses with filters
 *     description: Fetch all expenses within a date range with optional filters
 *     tags: [expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-04-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-04-30"
 *       - in: query
 *         name: expense_type
 *         schema:
 *           type: string
 *           enum: [purchase, transport, miscellaneous]
 *       - in: query
 *         name: supplier_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Expenses fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
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
 *             required:
 *               - expense_type
 *               - description
 *               - payment_method
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
 *                 description: Transport/misc OR itemised purchase
 *               quantity:
 *                 type: integer
 *               supplier_id:
 *                 type: string
 *                 format: uuid
 *               notes:
 *                 type: string
 *               expense_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Expense created
 */

/**
 * @swagger
 * /api/expenses/summary:
 *   get:
 *     summary: Get expense summary for a date range
 *     description: Returns total and category-wise breakdown of expenses
 *     tags: [expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-04-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-04-30"
 *     responses:
 *       200:
 *         description: Expense summary fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         purchase: { type: number }
 *                         transport: { type: number }
 *                         miscellaneous: { type: number }
 *                     expenseCount:
 *                       type: integer
 */

/**
 * @swagger
 * /api/expenses/profit-loss:
 *   get:
 *     summary: Get profit and loss report
 *     description: Returns revenue, expenses, and net profit
 *     tags: [expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Profit & Loss fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenue:
 *                   type: number
 *                 grossProfit:
 *                   type: number
 *                 expenses:
 *                   type: number
 *                 netProfit:
 *                   type: number
 */

/**
 * @swagger
 * /api/expenses/balance-sheet:
 *   get:
 *     summary: Get real-time balance sheet
 *     description: Returns assets, liabilities, and equity
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
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               expense_type:
 *                 type: string
 *                 enum: [purchase, transport, miscellaneous]
 *               payment_method:
 *                 type: string
 *                 enum: [cash, online]
 *               total_bill:
 *                 type: number
 *               unit_cost:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               supplier_id:
 *                 type: string
 *                 format: uuid
 *               notes:
 *                 type: string
 *               expense_date:
 *                 type: string
 *                 format: date
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
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Expense deleted
 *       404:
 *         description: Expense not found
 */