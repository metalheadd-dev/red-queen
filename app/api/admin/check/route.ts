import { checkAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const isAdmin = await checkAdmin(req);
  return Response.json({ isAdmin });
}
