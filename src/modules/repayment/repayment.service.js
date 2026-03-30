const Repayment = require('@root/models/repayments');
const CustomError = require('@utils/customError');

const getAll = async () => Repayment.findAll({ order: [['createdAt', 'DESC']] });

const getById = async (id) => {
  const repayment = await Repayment.findByPk(id);
  if (!repayment) throw new CustomError('Repayment not found', 404);
  return repayment;
};

const create = async ({ supplierName, contactDetails, amountOwed, dueDate }) => {
  return Repayment.create({ supplierName, contactDetails, amountOwed, dueDate });
};

const update = async (id, data) => {
  const repayment = await Repayment.findByPk(id);
  if (!repayment) throw new CustomError('Repayment not found', 404);

  // Fix: use explicit undefined check instead of ||
  // The || operator incorrectly keeps old value when new value is 0 or empty string
  if (data.supplierName  !== undefined) repayment.supplierName  = data.supplierName;
  if (data.contactDetails !== undefined) repayment.contactDetails = data.contactDetails;
  if (data.amountOwed    !== undefined) repayment.amountOwed    = data.amountOwed;
  if (data.dueDate       !== undefined) repayment.dueDate       = data.dueDate;

  await repayment.save();
  return repayment;
};

const remove = async (id) => {
  const repayment = await Repayment.findByPk(id);
  if (!repayment) throw new CustomError('Repayment not found', 404);
  await repayment.destroy();
};

module.exports = { getAll, getById, create, update, remove };
