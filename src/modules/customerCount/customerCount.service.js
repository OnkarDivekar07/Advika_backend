const CustomerCount = require('@root/models/CustomerCount');
const CustomError = require('@utils/customError');

const todayDate = () => new Date().toISOString().split('T')[0];

const getTodayCount = async () => {
  const [record] = await CustomerCount.findOrCreate({
    where: { date: todayDate() },
    defaults: { count: 0 },
  });
  return record;
};

const incrementCount = async () => {
  const [record] = await CustomerCount.findOrCreate({
    where: { date: todayDate() },
    defaults: { count: 0 },
  });
  record.count += 1;
  await record.save();
  return record;
};

const decrementCount = async () => {
  const record = await CustomerCount.findOne({ where: { date: todayDate() } });
  if (!record) throw new CustomError('No customer count record for today', 404);
  if (record.count <= 0) throw new CustomError('Count is already 0', 400);
  record.count -= 1;
  await record.save();
  return record;
};

const getAll = async () => CustomerCount.findAll({ order: [['date', 'DESC']] });

const getByDate = async (date) => {
  const record = await CustomerCount.findOne({ where: { date } });
  if (!record) throw new CustomError('No record found for given date', 404);
  return record;
};

module.exports = { getTodayCount, incrementCount, decrementCount, getAll, getByDate };
