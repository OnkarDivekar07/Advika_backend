/**
 * backfill-encrypt-suppliers.js
 * ------------------------------
 * ONE-TIME script. Run ONCE after deploying the encryption changes.
 * Reads every supplier row, decrypts (no-op if plain), then re-saves
 * so the model setter encrypts and writes the ciphertext back to DB.
 *
 * Safe to run multiple times — already-encrypted rows are detected by
 * the decrypt() guard in supplierCrypto.js and pass through unchanged.
 *
 * Usage:
 *   node scripts/backfill-encrypt-suppliers.js
 */
require('dotenv').config();
require('module-alias/register');

const sequelize = require('@utils/db');
const Supplier  = require('@root/models/supplier');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');

    const [rows] = await sequelize.query('SELECT id, name, phone FROM Suppliers');
    console.log(`Found ${rows.length} supplier(s) to process.`);

    let updated = 0;
    for (const row of rows) {
      const supplier = await Supplier.findByPk(row.id);
      if (!supplier) continue;

      // getter decrypts the stored value → setter re-encrypts it
      supplier.name  = supplier.name;
      supplier.phone = supplier.phone;
      await supplier.save();
      updated++;
      console.log(`  ✓ Supplier ${row.id} encrypted`);
    }

    console.log(`\nDone. ${updated}/${rows.length} row(s) encrypted.`);
    process.exit(0);
  } catch (err) {
    console.error('Backfill failed:', err.message);
    process.exit(1);
  }
})();
