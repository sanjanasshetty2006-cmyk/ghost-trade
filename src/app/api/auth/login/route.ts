import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password required" }, { status: 400 });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    // Update streak
    const today = new Date();
    const last = user.lastLoginDate;
    if (last) {
      const diff = Math.floor((today.getTime() - last.getTime()) / 86400000);
      user.streak = diff === 1 ? user.streak + 1 : diff === 0 ? user.streak : 1;
    } else {
      user.streak = 1;
    }
    user.lastLoginDate = today;
    await user.save();

    const token = await signToken({
    userId: user._id.toString(),
    email: user.email,
    });
    const userData = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      college: user.college,
      cashBalance: user.cashBalance,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      ghostMode: user.ghostMode,
    };

    const res = NextResponse.json({ success: true, data: { user: userData, token } });
    res.cookies.set("gt_token", token, { httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: "/" });
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
