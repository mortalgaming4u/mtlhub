import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data: requests, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    res.status(200).json(requests || []);
  } catch (err) {
    console.error("Logs fetch error:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
}