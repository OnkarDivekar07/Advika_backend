/**
 * @swagger
 * tags:
 *   name: Ranking
 *   description: Product sales frequency ranking. Rank 1 = fastest-moving product. Auto-updated on every billing.
 */

/**
 * @swagger
 * /api/ranking:
 *   get:
 *     summary: Get all products sorted by sales rank
 *     description: >
 *       Returns every product ordered by rank (rank 1 = sold most frequently).
 *       Products that have never been sold have rank = null and appear last.
 *       Rank is based on frequency of sale (how many billing transactions included
 *       this product), NOT total quantity sold.
 *     tags: [Ranking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ranked product list
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
 *                     $ref: '#/components/schemas/RankedProduct'
 */

/**
 * @swagger
 * /api/ranking/categories:
 *   get:
 *     summary: Get products split into fast / slow / non-moving buckets
 *     description: >
 *       Splits ranked products into three buckets:
 *       - **fast-moving**: top 33% by salesCount
 *       - **slow-moving**: middle 33%
 *       - **non-moving**: products never sold (salesCount = 0)
 *     tags: [Ranking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products bucketed by movement category
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:       { type: integer }
 *                         fastMoving:  { type: integer }
 *                         slowMoving:  { type: integer }
 *                         nonMoving:   { type: integer }
 *                     fastMoving:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RankedProduct'
 *                     slowMoving:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RankedProduct'
 *                     nonMoving:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RankedProduct'
 */

/**
 * @swagger
 * /api/ranking/reset:
 *   delete:
 *     summary: Reset all sales counts and ranks to zero
 *     description: >
 *       Clears salesCount and rank for all products. Useful for a seasonal reset
 *       or when starting fresh. This action is irreversible.
 *     tags: [Ranking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rankings reset successfully
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RankedProduct:
 *       type: object
 *       properties:
 *         id:              { type: string, format: uuid }
 *         name:            { type: string, example: "Rose" }
 *         marathiName:     { type: string, example: "गुलाब", nullable: true }
 *         quantity:        { type: integer, example: 40 }
 *         price:           { type: number, example: 25.5 }
 *         defaultUnit:     { type: string, enum: [pcs, jodi, dozen] }
 *         salesCount:      { type: integer, example: 87, description: "Number of billing transactions this product appeared in" }
 *         rank:            { type: integer, example: 1, nullable: true, description: "1 = top seller. null = never sold" }
 *         lower_threshold: { type: integer, example: 10 }
 *         upper_threshold: { type: integer, example: 100 }
 *         category:        { type: string, enum: [fast-moving, slow-moving, non-moving] }
 */


/**
 * @swagger
 * /api/ranking/inventory-distribution:
 *   get:
 *     summary: Get stock value distribution across movement categories
 *     description: >
 *       Returns the percentage of total inventory **value** (quantity × price)
 *       held in each movement category.
 *
 *       Useful for identifying how much capital is tied up in slow or non-moving stock.
 *     tags: [Ranking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory value distribution by category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Inventory distribution fetched
 *                 data:
 *                   type: object
 *                   properties:
 *                     overall:
 *                       type: object
 *                       properties:
 *                         totalStockValue:
 *                           type: number
 *                           example: 250000.00
 *                           description: Combined value of all products (quantity × price)
 *                         totalProducts:
 *                           type: integer
 *                           example: 40
 *                     fastMoving:
 *                       $ref: '#/components/schemas/InventoryDistributionBucket'
 *                     slowMoving:
 *                       $ref: '#/components/schemas/InventoryDistributionBucket'
 *                     nonMoving:
 *                       $ref: '#/components/schemas/InventoryDistributionBucket'
 *
 * components:
 *   schemas:
 *     InventoryDistributionBucket:
 *       type: object
 *       properties:
 *         productCount:
 *           type: integer
 *           example: 13
 *           description: Number of products in this category
 *         totalStockValue:
 *           type: number
 *           example: 175000.00
 *           description: Total value of stock in this category (quantity × price)
 *         percentageOfValue:
 *           type: number
 *           example: 70.00
 *           description: Percentage of total inventory value held in this category
 */