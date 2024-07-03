import { Charts } from "model";

const create = async (data: ChartInterface) => {
  const newData = new Charts(data);
  const saveData = await newData.save();
  if (!saveData) {
    throw new Error("Database Error");
  }
  return true;
};

const find = async (props: any) => {
  const { filter } = props;
  const result = await Charts.find(filter);
  return result;
};

const findOne = async (props: any) => {
  const { filter } = props;
  const result = await Charts.findOne(filter);
  return result;
};

const update = async (props: any) => {
  const { filter, update } = props;
  const result = await Charts.findOneAndUpdate(filter, update);
  return result;
};

const deleteOne = async (props: any) => {
  const { filter } = props;
  const result = await Charts.deleteOne(filter);
  return result;
};

export default {
  create,
  find,
  findOne,
  update,
  deleteOne,
};
