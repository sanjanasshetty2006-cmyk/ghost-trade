import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWeeklySnapshot extends Document {
  userId:         mongoose.Types.ObjectId;
  weekStart:      Date;
  portfolioValue: number;
  returnsPercent: number;
  totalPnl:       number;
  totalTrades:    number;
  winningTrades:  number;
  xp:             number;
  level:          number;
  createdAt:      Date;
  updatedAt:      Date;
}

const WeeklySnapshotSchema = new Schema<IWeeklySnapshot>(
  {
    userId:         { type: Schema.Types.ObjectId, ref: "User", required: true },
    weekStart:      { type: Date, required: true },
    portfolioValue: { type: Number, default: 0 },
    returnsPercent: { type: Number, default: 0 },
    totalPnl:       { type: Number, default: 0 },
    totalTrades:    { type: Number, default: 0 },
    winningTrades:  { type: Number, default: 0 },
    xp:             { type: Number, default: 0 },
    level:          { type: Number, default: 1 },
  },
  { timestamps: true }
);

WeeklySnapshotSchema.index({ userId: 1, weekStart: 1 }, { unique: true });
WeeklySnapshotSchema.index({ weekStart: -1, returnsPercent: -1 });

const WeeklySnapshotModel: Model<IWeeklySnapshot> =
  mongoose.models.WeeklySnapshot ??
  mongoose.model<IWeeklySnapshot>("WeeklySnapshot", WeeklySnapshotSchema);

export default WeeklySnapshotModel;