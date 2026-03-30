/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product inventory management
 */

/**
 * @swagger
 * /api/products/addproduct:
 *   post:
 *     summary: Add one or multiple products
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/Product'
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/Product'
 *           examples:
 *             single:
 *               summary: Single product
 *               value:
 *                 name: Rose
 *                 quantity: 100
 *                 price: 25.5
 *                 lower_threshold: 20
 *                 upper_threshold: 200
 *             bulk:
 *               summary: Multiple products
 *               value:
 *                 - name: Rose
 *                   quantity: 100
 *                   price: 25.5
 *                   lower_threshold: 20
 *                   upper_threshold: 200
 *                 - name: Marigold
 *                   quantity: 50
 *                   price: 10
 *                   lower_threshold: 10
 *                   upper_threshold: 100
 *     responses:
 *       201:
 *         description: Product(s) added successfully
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/products/getproduct:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all products
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
 *                         $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID (public)
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product UUID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/products/updateproduct/{id}:
 *   put:
 *     summary: Update product details
 *     tags: [Products]
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
 *               name: { type: string, example: Rose }
 *               quantity: { type: integer, example: 150 }
 *               price: { type: number, example: 30 }
 *               lower_threshold: { type: integer, example: 25 }
 *               upper_threshold: { type: integer, example: 250 }
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/products/removeproduct/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/products/add-stock:
 *   post:
 *     summary: Add stock to an existing product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, addQuantity]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 example: "a1b2c3d4-..."
 *               addQuantity:
 *                 type: integer
 *                 example: 50
 *               price:
 *                 type: number
 *                 example: 28
 *                 description: Optional — update price at same time
 *               lower_threshold:
 *                 type: integer
 *                 example: 20
 *               upper_threshold:
 *                 type: integer
 *                 example: 200
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/products/{id}/unit:
 *   put:
 *     summary: Update default unit for a product
 *     tags: [Products]
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
 *             required: [defaultUnit]
 *             properties:
 *               defaultUnit:
 *                 type: string
 *                 enum: [pcs, jodi, dozen]
 *                 example: jodi
 *     responses:
 *       200:
 *         description: Default unit updated
 *       400:
 *         description: Invalid unit value
 */

/**
 * @swagger
 * /api/products/{id}/marathi-name:
 *   put:
 *     summary: Update Marathi name for a product
 *     tags: [Products]
 *     security: []
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
 *             required: [marathiName]
 *             properties:
 *               marathiName:
 *                 type: string
 *                 example: गुलाब
 *     responses:
 *       200:
 *         description: Marathi name updated
 */

/**
 * @swagger
 * /api/products/{id}/upload-image:
 *   post:
 *     summary: Upload product image (multipart)
 *     tags: [Products]
 *     security: []
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded and URL returned
 *       400:
 *         description: No image uploaded
 */

/**
 * @swagger
 * /api/products/{id}/delete-image:
 *   delete:
 *     summary: Delete product image from S3
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Image deleted
 *       400:
 *         description: No image to delete
 */
