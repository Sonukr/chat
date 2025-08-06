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
stripeRoutes.get("/products", 
  // authMiddleware
  StripeController.getAllProducts
);

stripeRoutes.get("/checkout-url", 
  // authMiddleware
  StripeController.getCheckoutUrl
)

stripeRoutes.get("/subscription", 
  // authMiddleware
  StripeController.getSubscriptionByUserEmail
)

export default stripeRoutes;