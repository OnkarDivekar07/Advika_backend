const MissingItem = require('@root/models/MissingItem');
const CustomError = require('@utils/customError');

const getAll = async () => MissingItem.findAll();

const getById = async (id) => {
  const item = await MissingItem.findByPk(id);
  if (!item) throw new CustomError('Missing item not found', 404);
  return item;
};

const create = async (name) => {
  return MissingItem.create({ name });
};

const update = async (id, { name, requestCount }) => {
  const item = await MissingItem.findByPk(id);
  if (!item) throw new CustomError('Missing item not found', 404);
  if (name) item.name = name;
  if (requestCount !== undefined) item.requestCount = requestCount;
  await item.save();
  return item;
};

const remove = async (id) => {
  const item = await MissingItem.findByPk(id);
  if (!item) throw new CustomError('Missing item not found', 404);
  await item.destroy();
};

module.exports = { getAll, getById, create, update, remove };
