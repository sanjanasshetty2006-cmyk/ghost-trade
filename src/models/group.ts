import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGroup extends Document {
  _id:        mongoose.Types.ObjectId;
  name:       string;
  inviteCode: string;
  ownerId:    mongoose.Types.ObjectId;
  memberCount: number;
  createdAt:  Date;
  updatedAt:  Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name:        { type: String, required: true, trim: true, maxlength: 60 },
    inviteCode:  { type: String, required: true, unique: true, index: true, uppercase: true },
    ownerId:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    memberCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

GroupSchema.index({ ownerId: 1, createdAt: -1 });

const GroupModel: Model<IGroup> =
  mongoose.models.Group ?? mongoose.model<IGroup>("Group", GroupSchema);

export default GroupModel;