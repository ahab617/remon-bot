import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import config from "config.json";
import { initBot } from "./bot/index";
import {
  startBuyHandler,
  subscriptionHandler,
} from "blockchain/monitor/library";
import Moralis from "moralis";

const app: express.Express = express();

const connectDatabase = async (mongoUrl: string) => {
  try {
    const options = {
      autoCreate: true,
      retryReads: true,
    } as mongoose.ConnectOptions;
    mongoose.set("strictQuery", true);
    const result = await mongoose.connect(mongoUrl, options);
    if (result) {
      console.log("MongoDB connected");
      await Moralis.start({ apiKey: config.baseAPIKey });
      await initBot();
      await subscriptionHandler();
      await startBuyHandler();
    }
  } catch (err) {
    console.log("ConnectDatabase", err);
  }
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["POST", "GET"],
  })
);

connectDatabase(config.mongoURI)
  .then(async () => {
    app.listen(config.port, async () => {
      console.log(`Server listening on ${config.port} port`);
    });
  })
  .catch((err: any) => {
    console.log(err);
  });
