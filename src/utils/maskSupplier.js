/**
 * maskSupplier.js
 * ---------------
 * Returns a shallow copy of a plain supplier object with name & phone masked.
 * Used ONLY in API response layer — never inside business logic.
 *
 * Examples:
 *   phone "9876543210" → "XXXXXX3210"
 *   name  "Raju Flowers" → "XXXXXXwers"
 */
const maskSupplier = (supplier) => {
  if (!supplier) return supplier;

  const mask = (value) => {
    if (value == null || value === '') return value;
    const s = String(value);
    const tail = s.slice(-4);
    return `XXXXXX${tail}`;
  };

  return {
    ...supplier,
    name:  mask(supplier.name),
    phone: mask(supplier.phone),
  };
};

module.exports = { maskSupplier };
