import { Tokens } from "model";

const create = async (data: TokenInterface) => {
  const newData = new Tokens(data);
  const saveData = await newData.save();
  if (!saveData) {
    throw new Error("Database Error");
  }
  return true;
};

const find = async (props: any) => {
  const { filter } = props;
  const result = await Tokens.find(filter);
  return result;
};

const findOne = async (props: any) => {
  const { filter } = props;
  const result = await Tokens.findOne(filter);
  return result;
};

const update = async (props: any) => {
  const { filter, update } = props;
  const result = await Tokens.findOneAndUpdate(filter, update);
  return result;
};

const deleteMany = async (props: any) => {
  const { filter } = props;
  const result = await Tokens.deleteMany(filter);
  return result;
};

const deleteOne = async (props: any) => {
  const { filter } = props;
  const result = await Tokens.deleteOne(filter);
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
