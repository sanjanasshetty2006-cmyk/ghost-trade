import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHolding extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  companyName: string;
  exchange: string;
  industry: string;
  sector: string;
  marketCap: number;
  quantity: number;
  avgBuyPrice: number;
  totalInvested: number;
  createdAt: Date;
  updatedAt: Date;
}

const HoldingSchema = new Schema<IHolding>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol:        { type: String, required: true, uppercase: true, trim: true },
    companyName:   { type: String, required: true },
    exchange:      { type: String, default: "NSE" },
    industry:      { type: String, default: "Other" },
    sector:        { type: String, default: "Other" },
    marketCap:     { type: Number, default: 0 },
    quantity:      { type: Number, required: true, min: 0 },
    avgBuyPrice:   { type: Number, required: true, min: 0 },
    totalInvested: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

HoldingSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const HoldingModel: Model<IHolding> =
  mongoose.models.Holding ?? mongoose.model<IHolding>("Holding", HoldingSchema);

export default HoldingModel;