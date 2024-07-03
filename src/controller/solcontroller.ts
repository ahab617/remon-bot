import { SolTransactions } from "model";

const insertMany = async (data: SolInterface[]) => {
  const result = await SolTransactions.insertMany(data);
  return result;
};

const findOne = async (props: any) => {
  const { filter } = props;
  const result = await SolTransactions.findOne(filter);
  return result;
};

const find = async (props: any) => {
  const { filter } = props;
  const result = await SolTransactions.find(filter);
  return result;
};

const deleteMany = async (props: any) => {
  const { filter } = props;
  const result = await SolTransactions.deleteMany(filter);
  return result;
};

export default {
  insertMany,
  findOne,
  find,
  deleteMany,
};
