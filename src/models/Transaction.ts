import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  companyName: string;
  type: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "STOP_LOSS";
  quantity: number;
  price: number;
  total: number;
  pnl?: number; // for SELL transactions
  status: "EXECUTED" | "PENDING" | "CANCELLED";
  aiAnalysis?: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true },
    companyName: { type: String, required: true },
    type: { type: String, enum: ["BUY", "SELL"], required: true },
    orderType: { type: String, enum: ["MARKET", "LIMIT", "STOP_LOSS"], default: "MARKET" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    pnl: { type: Number },
    status: { type: String, enum: ["EXECUTED", "PENDING", "CANCELLED"], default: "EXECUTED" },
    aiAnalysis: { type: String },
  },
  { timestamps: true }
);

const TransactionModel: Model<ITransaction> =
  mongoose.models.Transaction ?? mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default TransactionModel;
