import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import GroupModel from "@/models/group";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { code } = await req.json();

    const group = await GroupModel.findOne({
      code: code.toUpperCase(),
    });

    if (!group) {
      return NextResponse.json(
        {
          success: false,
          error: "Group not found",
        },
        { status: 404 }
      );
    }

    if (
      group.members.some(
        (m: any) => m.toString() === payload.userId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Already a member",
        },
        { status: 400 }
      );
    }

    group.members.push(
      new mongoose.Types.ObjectId(payload.userId)
    );

    await group.save();

    return NextResponse.json({
      success: true,
      data: group,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}