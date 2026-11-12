import { prismadb } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await prismadb.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "ok" });
  } catch {
    return Response.json({ status: "unavailable", database: "unavailable" }, { status: 503 });
  }
}
