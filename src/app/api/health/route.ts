export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let supabase: "unset" | "ok" | "error" = "unset";
  if (url && key) {
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/players?select=id&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      supabase = res.ok ? "ok" : "error";
    } catch {
      supabase = "error";
    }
  }
  return Response.json({
    ok: true,
    app: "nfl-bolao",
    season: 2026,
    supabase,
  });
}
