import mongoose, { Schema, Document } from "mongoose";

export interface IStripePayment extends Document {
  userId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const StripePaymentSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    paymentIntentId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IStripePayment>("StripePayment", StripePaymentSchema);
