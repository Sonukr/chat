import { Router, Request, Response } from "express";
import StripeController from "../controllers/StripeController";
import { authMiddleware } from "../middleware";

const stripeRoutes = Router();
stripeRoutes.get("/", (req: Request, res: Response) => {
    res.send("Stripe Service is running");
});

stripeRoutes.get("/health", (req: Request, res: Response) => {
    res.status(200).send("OK");
});

// @ts-ignore
stripeRoutes.get("/products",  authMiddleware, StripeController.getAllProducts);
// @ts-ignore
stripeRoutes.get("/checkout-url",  authMiddleware, StripeController.getCheckoutUrl)
// @ts-ignore
stripeRoutes.get("/subscription-by-email",  authMiddleware, StripeController.getSubscriptionByUserEmail)
// @ts-ignore
stripeRoutes.get("/verify-session",  authMiddleware, StripeController.verifySession)
// @ts-ignore
stripeRoutes.post("/cancel-subscription", authMiddleware, StripeController.cancelSubscription)
// @ts-ignore
stripeRoutes.post("/update-subscription", authMiddleware, StripeController.updateSubscription)

export default stripeRoutes;