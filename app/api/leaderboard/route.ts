export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { error: "Legacy leaderboard retired. Use the opt-in SOLvivor readiness board." },
    { status: 410, headers: { Link: '</api/community/leaderboard>; rel="successor-version"' } },
  );
}
