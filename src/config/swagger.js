const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Advika Flowers Inventory API',
      version: '2.0.0',
      description: 'Complete API documentation for Advika Flowers Inventory Management System',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Local Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token. Get it from POST /api/user/login or POST /api/user/verify-otp',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Rose' },
            marathiName: { type: 'string', example: 'गुलाब' },
            quantity: { type: 'integer', example: 100 },
            price: { type: 'number', example: 25.5 },
            defaultUnit: { type: 'string', enum: ['pcs', 'jodi', 'dozen'], example: 'pcs' },
            lower_threshold: { type: 'integer', example: 20 },
            upper_threshold: { type: 'integer', example: 200 },
            imageUrl: { type: 'string', nullable: true, example: 'https://bucket.s3.amazonaws.com/product-images/abc.jpg' },
          },
        },
        Supplier: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Raju Flowers' },
            phone: { type: 'string', example: '9876543210' },
            is_active: { type: 'boolean', example: true },
          },
        },
        Repayment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            supplierName: { type: 'string', example: 'Raju Flowers' },
            contactDetails: { type: 'string', example: '9876543210' },
            amountOwed: { type: 'number', example: 5000 },
            dueDate: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            productId: { type: 'string', format: 'uuid' },
            itemsPurchased: { type: 'string' },
            quantity: { type: 'integer' },
            totalAmount: { type: 'number' },
            profit: { type: 'number' },
            paymentMethod: { type: 'string', enum: ['cash', 'online'] },
            isReversed: { type: 'boolean' },
            date: { type: 'string', format: 'date-time' },
          },
        },
        MissingItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', example: 'Sunflower' },
            requestCount: { type: 'integer', example: 3 },
          },
        },
        PurchaseOrder: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            supplier_id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            createdAt: { type: 'string', format: 'date-time' },
            fulfilmentSummary: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                pending: { type: 'integer' },
                ordered: { type: 'integer' },
                available: { type: 'integer' },
                not_available: { type: 'integer' },
                received: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, '../modules/**/*.docs.js'),
  ],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
