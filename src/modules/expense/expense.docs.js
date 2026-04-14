/**
 * @swagger
 * tags:
 *   name: expenses
 *   description: Expense management
 */

/**
 * @swagger
 * /api/expenses/expense:
 *   post:
 *     summary: Create a new expense
 *     tags: [expenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, expense_type, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1500
 *               expense_type:
 *                 type: string
 *                 example: rent
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-30"
 *               supplier_id:
 *                 type: integer
 *                 example: 2
 *               note:
 *                 type: string
 *                 example: Monthly shop rent
 *     responses:
 *       201:
 *         description: Expense recorded
 */

/**
 * @swagger
 * /api/expenses/expenses:
 *   get:
 *     summary: Get all expenses with filters
 *     tags: [expenses]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-03-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-03-31"
 *       - in: query
 *         name: expense_type
 *         schema:
 *           type: string
 *         example: rent
 *       - in: query
 *         name: supplier_id
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Expenses fetched
 */

/**
 * @swagger
 * /api/expenses/expense/{id}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *     responses:
 *       200:
 *         description: Expense deleted
 *       404:
 *         description: Expense not found
 */

/**
 * @swagger
 * /api/expenses/profit-loss:
 *   get:
 *     summary: Generate balance sheet
 *     tags: [expenses]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-03-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-03-31"
 *     responses:
 *       200:
 *         description: Balance sheet generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         assets:
 *                           type: object
 *                           properties:
 *                             cash:
 *                               type: number
 *                               example: 50000
 *                             inventory:
 *                               type: number
 *                               example: 120000
 *                             receivables:
 *                               type: number
 *                               example: 30000
 *                         liabilities:
 *                           type: object
 *                           properties:
 *                             payables:
 *                               type: number
 *                               example: 40000
 *                             loans:
 *                               type: number
 *                               example: 20000
 *                         equity:
 *                           type: number
 *                           example: 140000
 */

/**
 * @swagger
 * /api/expenses/expense-summary:
 *   get:
 *     summary: Get expense summary
 *     tags: [expenses]
 *     responses:
 *       200:
 *         description: Expense summary
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         total_expense:
 *                           type: number
 *                           example: 50000
 *                         by_type:
 *                           type: object
 *                           example:
 *                             rent: 20000
 *                             salary: 15000
 *                             electricity: 5000
 *                             misc: 10000
 */


/**
 * @swagger
 * /api/expenses/real-balance-sheet:
 *   get:
 *     summary: Get real-time balance sheet (no date filter)
 *     tags: [expenses]
 *     responses:
 *       200:
 *         description: Real balance sheet generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         assets:
 *                           type: object
 *                           properties:
 *                             cash:
 *                               type: number
 *                               example: 60000
 *                             inventory:
 *                               type: number
 *                               example: 150000
 *                             receivables:
 *                               type: number
 *                               example: 25000
 *                         liabilities:
 *                           type: object
 *                           properties:
 *                             payables:
 *                               type: number
 *                               example: 30000
 *                             loans:
 *                               type: number
 *                               example: 10000
 *                         equity:
 *                           type: number
 *                           example: 195000
 */