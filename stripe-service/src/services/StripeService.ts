import Stripe from 'stripe';
import config from '../config/config';
import StripePayment, { IStripePayment } from '../database/models/StripeModel';
import { res } from '../../../chat-service/node_modules/pino-http/node_modules/pino-std-serializers/index.d';
import { ApiError } from '../utils';

const stripe = new Stripe(config.STRIPE_SECRET_KEY || "");

class StripeService {
  async createPaymentIntent(amount: number, currency: string, userId: string) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { userId },
    });
    // Save to DB
    await StripePayment.create({
      userId,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      status: paymentIntent.status,
    });
    return paymentIntent;
  }

  async createSubscription(customerId: string, priceId: string) {
    // Assumes customer and price are already created in Stripe dashboard
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    return subscription;
  }

  async handleWebhook(event: Stripe.Event) {
    // Handle different event types (e.g., payment_intent.succeeded)
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Update DB record
        await StripePayment.findOneAndUpdate(
          { paymentIntentId: paymentIntent.id },
          { status: paymentIntent.status }
        );
        break;
      }
      // Add more event types as needed
      default:
        break;
    }
  }
  async getSubscriptionAndPricing(){
    try{
      const productsResp = await stripe.products.list();
      const pricesResp = await stripe.prices.list();
      const products = productsResp.data;
      const prices = pricesResp.data;
      const resp = products.map((item)=> {
        return {
          ...item,
          price: prices.find((price)=> price.product === item.id)
        }
      })
      return resp;
    }catch(error: any){
      throw new ApiError(500, error.message);
    }
    
  }

  async createCheckoutUrl(priceId: string, customerEmail?: string){
    try{
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
        // the actual Session ID is returned in the query parameter when your customer
        // is redirected to the success page.
        success_url: 'http://localhost:8084/success.html?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:8084/canceled.html',
        customer_email: customerEmail, // Prefill customer email if provided
        subscription_data: {
        
        }
      });
      return session.url;
    }catch(error: any){
      throw new ApiError(500, error.message);
    }
  }

  async getSubscriptionByUserEmail(email: string){
    try{
      const customer = await stripe.customers.list({
        email,
      });
      return customer;
    }catch(error: any){
      throw new ApiError(500, error.message);
    }
  }
}

export default new StripeService();
