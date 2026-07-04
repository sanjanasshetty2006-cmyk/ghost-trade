import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILeaderboardSnapshot extends Document {
  userId:         mongoose.Types.ObjectId;
  weekStart:      Date;   // Monday 00:00 UTC — used for weekly leaderboard
  portfolioValue: number;
  cashBalance:    number;
  investedValue:  number;
  totalPnl:       number;
  realizedPnl:    number;
  unrealizedPnl:  number;
  returnsPercent: number;
  totalTrades:    number;
  winningTrades:  number;
  xp:             number;
  level:          number;
  createdAt:      Date;
  updatedAt:      Date;
}

const LeaderboardSnapshotSchema = new Schema<ILeaderboardSnapshot>(
  {
    userId:         { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weekStart:      { type: Date, required: true, index: true },
    portfolioValue: { type: Number, default: 0 },
    cashBalance:    { type: Number, default: 0 },
    investedValue:  { type: Number, default: 0 },
    totalPnl:       { type: Number, default: 0 },
    realizedPnl:    { type: Number, default: 0 },
    unrealizedPnl:  { type: Number, default: 0 },
    returnsPercent: { type: Number, default: 0 },
    totalTrades:    { type: Number, default: 0 },
    winningTrades:  { type: Number, default: 0 },
    xp:             { type: Number, default: 0 },
    level:          { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Unique snapshot per user per week
LeaderboardSnapshotSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

const LeaderboardSnapshotModel: Model<ILeaderboardSnapshot> =
  mongoose.models.LeaderboardSnapshot ??
  mongoose.model<ILeaderboardSnapshot>("LeaderboardSnapshot", LeaderboardSnapshotSchema);

export default LeaderboardSnapshotModel;