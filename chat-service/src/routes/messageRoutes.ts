import { Router, Request, Response } from "express";
import MessageController from "../controllers/MessageController";
import { authMiddleware } from "../middleware";

const messageRoutes = Router();

// @ts-ignore
messageRoutes.post("/send", authMiddleware, MessageController.send);
messageRoutes.get(
    "/get/:receiverId",
    // @ts-ignore
    authMiddleware,
    MessageController.getConversation
);

messageRoutes.get("/", (req: Request, res: Response) => {
    res.send("Chat Service is running");
});

messageRoutes.get("/health", (req: Request, res: Response) => {
    res.status(200).send("OK");
});


export default messageRoutes;