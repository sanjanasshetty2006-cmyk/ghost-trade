import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWatchlistItem extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  companyName: string;
  exchange: string;
  createdAt: Date;
}

const WatchlistSchema = new Schema<IWatchlistItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true },
    companyName: { type: String, required: true },
    exchange: { type: String, default: "NSE" },
  },
  { timestamps: true }
);

WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const WatchlistModel: Model<IWatchlistItem> =
  mongoose.models.Watchlist ?? mongoose.model<IWatchlistItem>("Watchlist", WatchlistSchema);

export default WatchlistModel;
