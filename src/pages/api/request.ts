import { supabase } from "@/integrations/supabase/client";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = JSON.parse(req.body);

    if (!url || typeof url !== "string" || !url.includes("twkan.com")) {
      return res.status(400).json({ error: "Missing or invalid URL" });
    }

    // Extract slug from URL
    const match = url.match(/book\/(\d+)/);
    const slug = match ? match[1] : "unknown";

    // Insert request into database
    const { error } = await supabase.from("requests").insert([{ url, user_id: null }]);
    if (error) console.error("Request insert error:", error);

    // Return slug for frontend redirect
    res.status(200).json({ success: true, slug });
  } catch (error) {
    console.error("Request processing error:", error);
    res.status(500).json({ error: "Failed to process book request" });
  }
}
