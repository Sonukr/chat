import express from "express";
import proxy from "express-http-proxy";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// For Local
// const auth = proxy("http://localhost:8081");
// const messages = proxy("http://localhost:8082");
// const notifications = proxy("http://localhost:8083");

// For Docker
const auth = proxy("http://user:8081");
const messages = proxy("http://chat:8082");
const notifications = proxy("http://notification:8083");

app.use("/api/auth", auth);
app.use("/api/messages", messages);
app.use("/api/notifications", notifications);
app.use("/", (req, res) => {
    res.send("Gateway is running");
});

const server = app.listen(8080, () => {
    console.log("Gateway is Listening to Port 8080");
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