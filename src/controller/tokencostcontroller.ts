import { TokenCosts } from "model";

const create = async (data: TokenCostInterface) => {
  const newData = new TokenCosts(data);
  const saveData = await newData.save();
  if (!saveData) {
    throw new Error("Database Error");
  }
  return true;
};

const findOne = async (props: any) => {
  const { filter } = props;
  const result = await TokenCosts.findOne(filter);
  return result;
};

const update = async (props: any) => {
  const { filter, update } = props;
  const result = await TokenCosts.findOneAndUpdate(filter, update);
  return result;
};

export default {
  create,
  findOne,
  update,
};
