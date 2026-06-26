import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, password, college } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Name, email and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 });
    }

    const user = await UserModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      college: college?.trim(),
      cashBalance: 1000000,
      xp: 0,
      level: 1,
    });

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

    const res = NextResponse.json({ success: true, data: { user: userData, token } }, { status: 201 });
    res.cookies.set("gt_token", token, { httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: "/" });
    return res;
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
