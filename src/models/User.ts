import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "crypto";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  college?: string;
  cashBalance: number;
  xp: number;
  level: number;
  streak: number;
  lastLoginDate?: Date;
  ghostMode: boolean;
  theme: "dark" | "light";
  achievements: string[];
  totalTrades: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

// ── Password helpers (PBKDF2 via built-in crypto) ─────────────────────────────
function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(plain, salt, 100_000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(plain, salt, 100_000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

// ── Schema ────────────────────────────────────────────────────────────────────
const UserSchema = new Schema<IUser>(
  {
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, required: true, minlength: 6 },
    avatar:        { type: String },
    college:       { type: String },
    cashBalance:   { type: Number, default: 1_000_000 },  // ₹10,00,000
    xp:            { type: Number, default: 0 },
    level:         { type: Number, default: 1 },
    streak:        { type: Number, default: 0 },
    lastLoginDate: { type: Date },
    ghostMode:     { type: Boolean, default: false },
    theme:         { type: String, enum: ["dark", "light"], default: "dark" },
    achievements:  [{ type: String }],
    totalTrades:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  this.password = hashPassword(this.password);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return verifyPassword(candidate, this.password);
};

const UserModel: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default UserModel;
