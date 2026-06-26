import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import GroupModel from "@/models/group";
import { getUserFromRequest } from "@/lib/auth";

function generateCode() {
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
}

// GET → My Groups
export async function GET(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const groups = await GroupModel.find({
      members: payload.userId,
    });

    return NextResponse.json({
      success: true,
      data: groups,
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

// POST → Create Group
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

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Group name required",
        },
        { status: 400 }
      );
    }

    let code = generateCode();

    while (await GroupModel.exists({ code })) {
      code = generateCode();
    }

    const group = await GroupModel.create({
      name,
      code,
      owner: payload.userId,
      members: [payload.userId],
    });

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