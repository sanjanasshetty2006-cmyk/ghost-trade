import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPortfolioSnapshot extends Document {
  userId: mongoose.Types.ObjectId;
  totalValue: number;
  cashBalance: number;
  investedValue: number;
  pnl: number;
  pnlPercent: number;
  date: Date;
}

const SnapshotSchema = new Schema<IPortfolioSnapshot>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  totalValue: {
    type: Number,
    required: true,
  },
  cashBalance: {
    type: Number,
    required: true,
  },
  investedValue: {
    type: Number,
    required: true,
  },
  pnl: {
    type: Number,
    required: true,
  },
  pnlPercent: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

SnapshotSchema.index({ userId: 1, date: -1 });

const PortfolioSnapshotModel: Model<IPortfolioSnapshot> =
  mongoose.models.PortfolioSnapshot ??
  mongoose.model<IPortfolioSnapshot>(
    "PortfolioSnapshot",
    SnapshotSchema
  );

export default PortfolioSnapshotModel;