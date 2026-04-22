const Product = require('./product');
const Transaction = require('./transaction');
const User = require('./userdetails');
const InventoTracking = require('./inventoryTracking');
const Repayment = require('./repayments');
const MissingItem = require('./MissingItem');
const CustomerCount = require('./CustomerCount');
const Supplier = require('./supplier');
const ProductSupplier = require('./productsupplier');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const Expense = require('./Expense');
const StockLog = require('./StockLog');

// PurchaseOrder <-> PurchaseOrderItem
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'order_id', as: 'PurchaseOrderItems' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'order_id' });

// PurchaseOrderItem <-> Product
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'Product' });

// PurchaseOrderItem <-> Supplier
PurchaseOrderItem.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'Supplier' });

// ProductSupplier <-> Supplier
ProductSupplier.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'Supplier' });

// Expense <-> Supplier (optional: a purchase expense may reference a supplier)
Expense.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'Supplier' });
Supplier.hasMany(Expense,   { foreignKey: 'supplier_id', as: 'Expenses' });

// StockLog <-> Product
StockLog.belongsTo(Product, { foreignKey: 'productId', as: 'Product' });
Product.hasMany(StockLog,   { foreignKey: 'productId', as: 'StockLogs' });

module.exports = {
  Product,
  Transaction,
  User,
  InventoTracking,
  Repayment,
  MissingItem,
  CustomerCount,
  Supplier,
  ProductSupplier,
  PurchaseOrder,
  PurchaseOrderItem,
  Expense,
  StockLog,
};
