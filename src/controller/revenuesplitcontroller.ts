import { RevenueSplits } from "model";

const create = async (data: RevenueSplitInterface) => {
  const newData = new RevenueSplits(data);
  const saveData = await newData.save();
  if (!saveData) {
    throw new Error("Database Error");
  }
  return true;
};

const findOne = async (props: any) => {
  const { filter } = props;
  const result = await RevenueSplits.findOne(filter);
  return result;
};

const update = async (props: any) => {
  const { filter, update } = props;
  const result = await RevenueSplits.findOneAndUpdate(filter, update);
  return result;
};

export default {
  create,
  findOne,
  update,
};
