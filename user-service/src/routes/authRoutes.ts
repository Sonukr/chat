import { Router, Request, Response } from "express";
import AuthController from "../controllers/AuthController";

const userRouter = Router();

userRouter.post("/register", AuthController.register);
userRouter.post("/login", AuthController.login);

userRouter.get("/", (req: Request, res: Response) => {
    res.send("User Service is running");
});

export default userRouter;