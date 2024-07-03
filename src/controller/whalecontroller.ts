import { Whales } from "model";

const create = async (data: WhaleInterface) => {
  const newData = new Whales(data);
  const saveData = await newData.save();
  if (!saveData) {
    throw new Error("Database Error");
  }
  return true;
};

const find = async (props: any) => {
  const { filter } = props;
  const result = await Whales.find(filter);
  return result;
};

const findOne = async (props: any) => {
  const { filter } = props;
  const result = await Whales.findOne(filter);
  return result;
};

const update = async (props: any) => {
  const { filter, update } = props;
  const result = await Whales.findOneAndUpdate(filter, update);
  return result;
};

const deleteMany = async (props: any) => {
  const { filter } = props;
  const result = await Whales.deleteMany(filter);
  return result;
};

const deleteOne = async (props: any) => {
  const { filter } = props;
  const result = await Whales.deleteOne(filter);
  return result;
};

export default {
  create,
  find,
  findOne,
  update,
  deleteMany,
  deleteOne,
};
