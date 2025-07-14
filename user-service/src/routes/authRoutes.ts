import { Router, Request, Response } from "express";
import AuthController from "../controllers/AuthController";
import { authMiddleware } from "../middleware/auth";

const userRouter = Router();

userRouter.post("/register", AuthController.register);
userRouter.post("/login", AuthController.login);
userRouter.get("/me", authMiddleware, AuthController.me);
userRouter.get("/all", authMiddleware, AuthController.getAllUsers);

userRouter.get("/", (req: Request, res: Response) => {
    res.send("User Service is running");
});

export default userRouter;