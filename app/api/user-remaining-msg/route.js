import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { aj } from "@/config/Arcjet";

export async function POST(req) {
  const user = await currentUser();

  let token;
  try {
    const body = await req.json();
    token = body?.token;
  } catch {
    // no JSON body provided → leave token as undefined
    token = undefined;
  }

  if (!user?.primaryEmailAddress?.emailAddress) {
    return NextResponse.json(
      { error: "User email is missing!" },
      { status: 400 }
    );
  }

  if (token) {
    const decision = await aj.protect(req, {
      userId: user.primaryEmailAddress.emailAddress,
      requested: token,
    });

    if (decision.isDenied()) {
      return NextResponse.json({
        error: "Too many requests",
        remainingToken: decision.reason.remaining,
      });
    }

    return NextResponse.json({
      allowed: true,
      remainingToken: decision.reason.remaining,
    });
  }

  // fallback when no token passed
  const decision = await aj.protect(req, {
    userId: user.primaryEmailAddress.emailAddress,
    requested: 0,
  });

  return NextResponse.json({ remainingToken: decision.reason.remaining });
}
