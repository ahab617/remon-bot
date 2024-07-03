import { AdSettings } from "model";

const create = async (data: any) => {
  const newData = new AdSettings(data);
  const saveData = await newData.save();
  if (!saveData) {
    throw new Error("Database Error");
  }
  return true;
};

const findOne = async (props: any) => {
  const { filter } = props;
  const result = await AdSettings.findOne(filter);
  return result;
};

const update = async (props: any) => {
  const { filter, update } = props;
  const result = await AdSettings.findOneAndUpdate(filter, update);
  return result;
};

const deleteOne = async (props: any) => {
  const { filter } = props;
  const result = await AdSettings.deleteOne(filter);
  return result;
};

export default {
  create,
  findOne,
  update,
  deleteOne,
};
