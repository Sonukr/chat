import express, { Express } from "express";
import userRouter from "./routes/stripeRoutes";
import { errorConverter, errorHandler, requestLogger } from "./middleware";
import { Server } from 'http';
import config from "./config/config";
import { connectDB } from "./database";

let server: Server;
const app: Express = express();
app.use(express.json());
app.use(requestLogger);
app.use(express.urlencoded({ extended: true }));
app.use(userRouter);
app.use(errorConverter);
app.use(errorHandler);

connectDB();

server = app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
});

const exitHandler = () => {
  if (server) {
      server.close(() => {
          console.info("Server closed");
          process.exit(1);
      });
  } else {
      process.exit(1);
  }
};

const unexpectedErrorHandler = (error: unknown) => {
  console.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);