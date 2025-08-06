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
    const {priceId, email} = req.query;
    if(!priceId){
        return res.status(400).json({
            status: 400,
            message: "priceId is required",
        })
    }
    
    let customerEmail: string | undefined;
    
    // Check if user is authenticated (has user info in request)
    if ((req as AuthRequest).user) {
        // Use authenticated user's email if available
        customerEmail = (req as AuthRequest).user.email;
    } else if (email) {
        // Use email from query parameter if provided
        customerEmail = email as string;
    }
    
    try{
        const url = await StripeService.createCheckoutUrl(priceId as string, customerEmail);
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

const getSubscriptionByUserEmail = async(req: Request, res: Response) => {
    const {email} = req.query;
    if(!email){
        return res.status(400).json({
            status: 400,
            message: "email is required"
        })
    }
    try{
        const subscription = await StripeService.getSubscriptionByUserEmail(email as string);
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

export default {
    getAllProducts,
    getCheckoutUrl,
    getSubscriptionByUserEmail
};