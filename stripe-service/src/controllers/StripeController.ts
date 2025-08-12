import { Request, Response } from "express";
import { AuthRequest } from "../middleware";
import { ApiError } from "../utils";
import StripeService from "../services/StripeService";

const getAllProducts = async (req: Request, res: Response) => {
    try {
        const resp = await StripeService.getSubscriptionAndPricing();
        return res.json({
            status: 200,
            data: resp,
        });
    } catch (error: any) { 
        res.status(500).json({
            status: 500,
            message: error.message,
        })
    }
};

const getCheckoutUrl = async(req: Request, res: Response) => {
    const { priceId, quantity = 1 } = req.query;
    if(!priceId){
        return res.status(400).json({
            status: 400,
            message: "priceId is required",
        })
    }
    const authUser = (req as AuthRequest).user;
    if (!authUser || !authUser._id || !authUser.email) {
        return res.status(401).json({
            status: 401,
            message: "User not authenticated or missing details",
        });
    }
    
    try{
        const url = await StripeService.createCheckoutUrl(priceId as string, authUser._id, authUser.email, quantity as number);
        res.status(200).json({
            status: 200,
            checkoutUrl: url
        });
    }catch(error: any){
        return res.status(500).json({
            status: 500,
            message: error.message,
        })
    }   
}

const verifySession = async(req: Request, res: Response) => {
    const { sessionId } = req.query;
    if (!sessionId) {
        return res.status(400).json({ status: 400, message: "sessionId is required" });
    }

    try {
        const session = await StripeService.retrieveCheckoutSession(sessionId as string);

        if (session.status === 'complete') {
            // Session is paid and complete.
            // Now, fulfill the purchase.
            const userId = session.client_reference_id;
            const stripeCustomer = session.customer;
            const stripeSubscription = session.subscription;

            // --- Your Database Logic ---
            // 1. Find user in your DB via `userId`.
            // 2. Save `stripeCustomerId` and `stripeSubscriptionId` to the user's record.
            // 3. Update the user's role or permissions to grant access to premium features.
            //    (This part is conceptual as it depends on your user service/model)
            console.log(`User ${userId} successfully subscribed. Customer: ${stripeCustomer}, Subscription: ${stripeSubscription}`);

            return res.status(200).json({
                status: 200,
                message: "Subscription verified successfully.",
                data :{
                    userId, 
                    stripeCustomer,
                    stripeSubscription
                }
            });
        }

        return res.status(400).json({ status: 400, message: "Checkout session not complete." });

    } catch (error: any) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        })
    }
}

const getSubscriptionByUserEmail = async(req: Request, res: Response) => {
    const authUser = (req as AuthRequest).user;
    if (!authUser || !authUser._id || !authUser.email) {
        return res.status(401).json({
            status: 401,
            message: "User not authenticated or missing details",
        });
    }
    try{
        const subscription = await StripeService.getSubscriptionByUserEmail(authUser.email);
        res.status(200).json({
            status: 200,
            data: subscription
        })
    }catch(error: any){
        res.status(500).json({
            status: 500,
            message: error.message,
        })
    }
}

const cancelSubscription = async(req: Request, res: Response) => {
    const {subscriptionId} = req.body;
    if(!subscriptionId){
        return res.status(400).json({
            status: 400,
            message: "subscriptionId is required",
        })
    }
    try{
        const deletedSubscription = await StripeService.cancelSubscription(subscriptionId);
        res.status(200).json({
            status: 200,
            data: deletedSubscription
        })
    }catch(error: any){
        res.status(500).json({
            status: 500,
            message: error.message,
        })
    }
}

const updateSubscription = async(req: Request, res: Response) => {
    const {subscriptionId, priceId} = req.body;
    if(!subscriptionId || !priceId){
        return res.status(400).json({
            status: 400,
            message: "subscriptionId and priceId are required",
        })
    }
    try{
        const updatedSubscription = await StripeService.updateSubscription(subscriptionId, priceId);
        res.status(200).json({
            status: 200,
            data: updatedSubscription
        })
    }catch(error: any){
        res.status(500).json({
            status: 500,
            message: error.message,
        })
    }
}

export default {
    getAllProducts,
    getCheckoutUrl,
    getSubscriptionByUserEmail,
    verifySession,
    cancelSubscription,
    updateSubscription
};