import { Ads } from "model";

const create = async (data: AdInterface) => {
  const newData = new Ads(data);
  const saveData = await newData.save();
  if (!saveData) {
    throw new Error("Database Error");
  }
  return true;
};

const find = async (props: any) => {
  const { filter } = props;
  const result = await Ads.find(filter);
  return result;
};

const findOne = async (props: any) => {
  const { filter } = props;
  const result = await Ads.findOne(filter);
  return result;
};

const update = async (props: any) => {
  const { filter, update } = props;
  const result = await Ads.findOneAndUpdate(filter, update);
  return result;
};

const deleteOne = async (props: any) => {
  const { filter } = props;
  const result = await Ads.deleteOne(filter);
  return result;
};

export default {
  create,
  find,
  findOne,
  update,
  deleteOne,
};
