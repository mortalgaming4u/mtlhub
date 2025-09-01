import fs from "fs";
import path from "path";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { slug } = req.query;
  if (typeof slug !== "string") {
    return res.status(400).json({ error: "Invalid slug" });
  }

  const filePath = path.join(process.cwd(), "data", `${slug}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Book not found" });
  }

  try {
    const bookData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    res.status(200).json(bookData);
  } catch (err) {
    console.error("Failed to parse book file:", err);
    res.status(500).json({ error: "Failed to load book data" });
  }
}
