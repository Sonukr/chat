import express from "express";
import proxy from "express-http-proxy";
import cors from "cors";
import axios from "axios";

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

const SERVICES = {
    auth: "http://user:8081",
    messages: "http://chat:8082",
    notifications: "http://notification:8083",
};

app.use("/api/auth", auth);
app.use("/api/messages", messages);
app.use("/api/notifications", notifications);
app.get("/", async (req, res) => {
    const results: Record<string, "up" | "down"> = {};

    await Promise.all(
        Object.entries(SERVICES).map(async ([key, baseUrl]) => {
            try {
                const response = await axios.get(`${baseUrl}/health`, {
                    timeout: 2000,
                });
                results[key] = response.status === 200 ? "up" : "down";
            } catch (err) {
                results[key] = "down";
            }
        })
    );

    res.json({
        gateway: "up",
        services: results,
    });
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