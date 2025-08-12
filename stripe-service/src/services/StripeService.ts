import Stripe from 'stripe';
import config from '../config/config';
import StripePayment, { IStripePayment } from '../database/models/StripeModel';
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
      const pricesResp = await stripe.prices.list({ expand: ["data.tiers"] });
      const products = productsResp.data;
      const prices = pricesResp.data;
      const resp = products.map((item)=> {
        return {
          ...item,
          prices: prices.filter((price) => price.product === item.id)
        }
      })
      return resp;
    }catch(error: any){
      throw new ApiError(500, error.message);
    }
    
  }

  async createCheckoutUrl(
    priceId: string,
    userId: string,
    customerEmail?: string,
    quantity: number = 1
  ) { 
    try {
      // 1. Create/find customer
      const customer = await this.getOrCreateCustomerByEmail(customerEmail);
      if (!customer) throw new ApiError(400, "Customer email is required to create or retrieve customer.");
  
      // 2. Get active subscription, if any
      const currentSub = await getActiveSubscriptionByCustomer(customer.id);
  
      // 3. If no active subscription, create simple checkout session (new subscription)
      if (!currentSub) {
        const session = await createCheckoutSession(userId, customer.id, priceId, quantity);
        return session.url!;
      }
  
      // 4. If active subscription exists, get current price id
      const currentPriceId = currentSub.items.data[0].price.id;
      if (currentPriceId === priceId) {
        // Same plan: No action needed
        return "Already subscribed to this plan";
      }
  
      // 5. Check if this is an upgrade or downgrade
      const upgrade = await isUpgrade(currentPriceId, priceId);
  
      if (upgrade) {
        // === Upgrade Flow ===

        // Check if the current subscription is scheduled to cancel at period end
        if (currentSub.cancel_at_period_end) {
          // If user is upgrading to the same higher plan that is scheduled to cancel
          if (currentSub.items.data[0].price.id === priceId) {
            // Reactivate the subscription by turning off cancel_at_period_end
            const reactivatedSub = await stripe.subscriptions.update(currentSub.id, {
              cancel_at_period_end: false,
              metadata: {}, // clear any scheduled downgrade metadata
              expand: ['latest_invoice.payment_intent'],
            });

            return {
              data: reactivatedSub,
              message: "Reactivated existing higher subscription without creating a new one.",
            };
          }
        }
        
        // Update subscription immediately with proration
        const updatedSub = await stripe.subscriptions.update(currentSub.id, {
          cancel_at_period_end: false,
          proration_behavior: "create_prorations",
          items: [{
            id: currentSub.items.data[0].id,
            price: priceId,
          }],
          expand: ['latest_invoice.payment_intent'],
          metadata: {},
        });
  
        // Get latest invoice id and hosted url to pay proration immediately
        const latestInvoice = updatedSub.latest_invoice as Stripe.Invoice | undefined;
        const invoiceUrl = latestInvoice?.hosted_invoice_url;
  
        return {
          data: updatedSub,
          message: "Upgraded subscription with proration. Please pay the proration invoice to activate new plan.",
          latestInvoice: latestInvoice,
        };
      } else {
        // === Downgrade Flow ===
        // 1. Schedule current subscription to cancel at period end & save downgrade price
        await stripe.subscriptions.update(currentSub.id, {
          cancel_at_period_end: true,
          metadata: { scheduled_lower_price: priceId },
        });
  
        // 2. Create future subscription starting at current period end
        const periodEnd = currentSub.billing_cycle_anchor;
        // const periodEnd = currentSub.current_period_end;
  
        const futureSub = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: priceId }],
          billing_cycle_anchor: periodEnd,
          // Remove trial_end or set it carefully if needed
          proration_behavior: 'none',
          metadata: { created_by: 'scheduled downgrade' },
        });
  
        return {
          data: futureSub,
          message: `Downgrade scheduled. Your current plan remains active until ${new Date(periodEnd * 1000).toLocaleString()}, after which the lower plan will begin.`,
        };
      }
    } catch (error: any) {
      throw new ApiError(500, error.message);
    }
  }

  
  async createCheckoutUrls(priceId: string, userId: string, customerEmail?: string){
    try{
      // Find or create Stripe customer
      const customer = await this.getOrCreateCustomerByEmail(customerEmail);
      const currentSub = await getActiveSubscriptionByCustomer(customer ? customer?.id  : '');
      
      if(!currentSub){
        console.log("No active subscription");
        const session = await createCheckoutSession(userId, customer?.id || '', priceId);
        return  session.url;
      }

      const currentPriceId = currentSub?.items.data[0].price.id || '';
      console.log("currentPriceId", currentPriceId);
      const upgrade = await isUpgrade(currentPriceId, priceId);
      console.log("upgrade", upgrade);
      
      if (currentPriceId === priceId) {
        console.log("Already subscribed to this plan");
        return "Already subscribed to this plan";
      }

      if (upgrade) {
        const updatedSub = await stripe.subscriptions.update(currentSub.id, {
          cancel_at_period_end: false, // just in case
          proration_behavior: "create_prorations",
          items: [{
            id: currentSub.items.data[0].id,
            price: priceId,
          }]
        });
        return {data: updatedSub, message: "Upgraded subscription with proration"};
      } else {
        console.log("Updating subscription");
        const downgradedSub = await stripe.subscriptions.update(currentSub.id, {
          cancel_at_period_end: true,
          metadata: {
            scheduled_downgrade_price: priceId,
          }
        });
        return {data: downgradedSub, message: "Downgrade scheduled. New plan will start after current period."};
      }
    }catch(error: any){
      throw new ApiError(500, error.message);
    }
  }

  async getOrCreateCustomerByEmail(email?: string) {
    if (!email) return undefined;
  
    // Try to find existing customer with this email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) return customers.data[0];
  
    // No existing customer — create one
    return stripe.customers.create({ email });
  };
  

  async retrieveCheckoutSession(sessionId: string) {
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription', 'customer'],
        });
        return session;
    } catch (error: any) {
        throw new ApiError(500, error.message);
    }
  }

  async getSubscriptionByUserEmail(email: string) {
    try {
      const customers = await stripe.customers.list({
        email, limit: 1
      });

      const customerId = customers.data[0].id;

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active', // can be 'all' if you want all statuses
        limit: 1,
      });
      if (subscriptions.data.length === 0) {
        return null; // No active subscription found
      }
      const subscriptionId = subscriptions.data[0].id;
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: [
          'latest_invoice',
          'customer.invoice_settings.default_payment_method',
          'items.data.price.product',
        ],
      });

      return subscription.items.data[0];
    } catch (error: any) {
      throw new ApiError(500, error.message);
    }
  }
  async cancelSubscription(subscriptionId: string) {
    try{
      const deletedSubscription = await stripe.subscriptions.cancel(subscriptionId);
      return deletedSubscription;
    }catch(error: any){
      throw new ApiError(500, error.message);
    }
  }
  async updateSubscription(subscriptionId: string, newPriceId: string) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price'],
      });

      const currentItem = subscription.items.data[0];
      if (!currentItem) {
        throw new ApiError(404, 'Subscription item not found on the subscription.');
      }

      const currentPrice = currentItem.price;

      if (currentPrice.id === newPriceId) {
        // Already on this plan, no change needed.
        return subscription;
      }

      const newPrice = await stripe.prices.retrieve(newPriceId);

      // Compare amounts to determine if it's an upgrade or downgrade.
      const currentAmount = currentPrice.unit_amount;
      const newAmount = newPrice.unit_amount;

      if (currentAmount === null || newAmount === null) {
        throw new ApiError(400, 'Price amount is not available for comparison.');
      }

      let prorationBehavior: Stripe.SubscriptionUpdateParams.ProrationBehavior = 'create_prorations';

      if (newAmount < currentAmount) {
        // This is a downgrade. The change will take effect at the end of the current billing period.
        prorationBehavior = 'none';
      }

      return stripe.subscriptions.update(subscriptionId, {
        items: [{ id: currentItem.id, price: newPriceId }],
        proration_behavior: prorationBehavior,
      });
    } catch (error: any) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new ApiError(error.statusCode || 500, error.message);
      }
      throw new ApiError(500, error.message);
    }
  }
}

// --- Utilities ---
async function getActiveSubscriptionByCustomer(customerId: string): Promise<Stripe.Subscription | null> {
  console.log("customerId", customerId);
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1
  });
  return subscriptions.data.length ? subscriptions.data[0] : null;
}

async function isUpgrade(oldPriceId: string, newPriceId: string): Promise<boolean> {
  const [oldPrice, newPrice] = await Promise.all([
    stripe.prices.retrieve(oldPriceId),
    stripe.prices.retrieve(newPriceId),
  ]);
  return (newPrice.unit_amount ?? 0) > (oldPrice.unit_amount ?? 0);
}

async function createCheckoutSession(userId: string, customerId: string, priceId: string, quantity: number = 1) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const subscriptionData = {
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: quantity,
      },
    ],
    // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
    // the actual Session ID is returned in the query parameter when your customer
    // is redirected to the success page.
    success_url: `${frontendUrl}/subscription/status?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/subscription/status?status=cancel`,
    client_reference_id: userId, // Link the session to your internal user ID
    // customer_email: customerEmail, // Prefill customer email if provided
    // Other customer details can be added here
    customer: customerId,
    subscription_data: {
    }
  };
  const session = await stripe.checkout.sessions.create(subscriptionData as any);
  return session;
}

export default new StripeService();
