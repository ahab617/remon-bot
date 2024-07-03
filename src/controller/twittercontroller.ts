import { Twitters } from "model";

const create = async (data: TwitterInterface) => {
  const newData = new Twitters(data);
  const saveData = await newData.save();
  if (!saveData) {
    throw new Error("Database Error");
  }
  return true;
};

const findOne = async (props: any) => {
  const { filter } = props;
  const result = await Twitters.findOne(filter);
  return result;
};

const find = async (props: any) => {
  const { filter } = props;
  const result = await Twitters.find(filter);
  return result;
};

const update = async (props: any) => {
  const { filter, update } = props;
  const result = await Twitters.findOneAndUpdate(filter, update);
  return result;
};

const deleteOne = async (props: any) => {
  const { filter } = props;
  const result = await Twitters.deleteOne(filter);
  return result;
};

export default {
  create,
  findOne,
  find,
  update,
  deleteOne,
};
