import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGroupMember extends Document {
  groupId:   mongoose.Types.ObjectId;
  userId:    mongoose.Types.ObjectId;
  role:      "owner" | "member";
  joinedAt:  Date;
}

const GroupMemberSchema = new Schema<IGroupMember>(
  {
    groupId:  { type: Schema.Types.ObjectId, ref: "Group",  required: true, index: true },
    userId:   { type: Schema.Types.ObjectId, ref: "User",   required: true, index: true },
    role:     { type: String, enum: ["owner", "member"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// One membership per user per group
GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
// Fast lookup of all groups a user belongs to
GroupMemberSchema.index({ userId: 1, joinedAt: -1 });

const GroupMemberModel: Model<IGroupMember> =
  mongoose.models.GroupMember ??
  mongoose.model<IGroupMember>("GroupMember", GroupMemberSchema);

export default GroupMemberModel;