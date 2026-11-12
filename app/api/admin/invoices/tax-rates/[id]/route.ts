import { NextRequest, NextResponse } from "next/server";
import {
  requireRole,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

async function ensureAdmin(): Promise<NextResponse | null> {
  try {
    await requireRole(["admin"]);
    return null;
  } catch (e) {
    if (e instanceof AuthorizationError)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (e instanceof AuthenticationError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  const denied = await ensureAdmin();
  if (denied) return denied;

  void request;
  return NextResponse.json({ error: "Tax configuration is disabled in MARK IV V1." }, { status: 410 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  const denied = await ensureAdmin();
  if (denied) return denied;

  return NextResponse.json({ error: "Tax configuration is disabled in MARK IV V1." }, { status: 410 });
}
