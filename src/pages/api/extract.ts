// pages/api/extract.ts
import { processRequest } from "@/lib/processRequest";

export default async function handler(req: any, res: any) {
  const { slug } = req.query;

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "Missing or invalid slug" });
  }

  try {
    const result = await processRequest(slug);
    res.status(200).json(result);
  } catch (err) {
    console.error("Extraction error:", err);
    res.status(500).json({ error: "Failed to extract book" });
  }
}
