import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface IngestForm {
  bookUrl: string;
  chapterPattern: string;
  imageUrl: string;
  titleEn: string;
  titleZh: string;
  synopsis: string;
  author: string;
  genres: string;
  tags: string;
}

const RequestPage = () => {
  const [form, setForm] = useState<IngestForm>({
    bookUrl: "",
    chapterPattern: "",
    imageUrl: "",
    titleEn: "",
    titleZh: "",
    synopsis: "",
    author: "",
    genres: "",
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Append a timestamped message to debug console
  const log = (msg: string) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setDebugLogs((prev) => [...prev, entry].slice(-100));
    requestAnimationFrame(() => {
      if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }
    });
  };

  // Validators
  const isValidBookUrl = (url: string) =>
    /^https?:\/\/(www\.)?ixdzs\.tw\/book\/\d+/.test(url);

  const isValidChapterPattern = (pattern: string) =>
    /^(p?\d+\.html)$/.test(pattern);

  const isValidUrl = (url: string) =>
    /^https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|gif)$/.test(url);

  // Handle form field changes
  const handleChange = (field: keyof IngestForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Submit to /api/ingest
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    log("Submitting ingestion request...");

    // Validate fields
    if (!isValidBookUrl(form.bookUrl)) {
      toast.error("Invalid book URL. Must be ixdzs.tw/book/{id}");
      return;
    }
    if (form.chapterPattern && !isValidChapterPattern(form.chapterPattern)) {
      toast.error("Invalid chapter pattern. Example: 1.html or p1.html");
      return;
    }
    if (form.imageUrl && !isValidUrl(form.imageUrl)) {
      toast.error("Invalid image URL. Must end with .jpg/.png/.gif");
      return;
    }
    if (!form.titleEn.trim()) {
      toast.error("English title is required");
      return;
    }
    if (!form.titleZh.trim()) {
      toast.error("Chinese title is required");
      return;
    }
    if (!form.author.trim()) {
      toast.error("Author name is required");
      return;
    }

    setLoading(true);
    log("Calling backend API /api/ingest");

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        toast.error(`Ingestion failed: ${data.message}`);
        log(`Error: ${data.message}`);
        return;
      }

      log("Ingestion succeeded, navigating to reader");
      navigate(`/read/${data.novel_id}`);
    } catch (err: any) {
      setLoading(false);
      toast.error(`Network error: ${err.message}`);
      log(`Network error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📥 New Novel Ingestion</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="url"
          placeholder="Book URL (ixdzs.tw/book/{id})"
          value={form.bookUrl}
          onChange={(e) => handleChange("bookUrl", e.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <input
          type="text"
          placeholder="Chapter Pattern (e.g. 1.html or p1.html)"
          value={form.chapterPattern}
          onChange={(e) => handleChange("chapterPattern", e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />

        <input
          type="url"
          placeholder="Cover Image URL (jpg, png, gif)"
          value={form.imageUrl}
          onChange={(e) => handleChange("imageUrl", e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />

        <input
          type="text"
          placeholder="Book Title (English)"
          value={form.titleEn}
          onChange={(e) => handleChange("titleEn", e.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <input
          type="text"
          placeholder="Book Title (Chinese)"
          value={form.titleZh}
          onChange={(e) => handleChange("titleZh", e.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <textarea
          placeholder="Synopsis"
          value={form.synopsis}
          onChange={(e) => handleChange("synopsis", e.target.value)}
          className="w-full px-4 py-2 border rounded"
          rows={3}
        />

        <input
          type="text"
          placeholder="Author Name"
          value={form.author}
          onChange={(e) => handleChange("author", e.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <input
          type="text"
          placeholder="Genres (comma-separated)"
          value={form.genres}
          onChange={(e) => handleChange("genres", e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />

        <input
          type="text"
          placeholder="Tags (comma-separated)"
          value={form.tags}
          onChange={(e) => handleChange("tags", e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Submitting..." : "Submit Novel"}
        </button>
      </form>

      <div
        className="mt-8 bg-black text-green-400 font-mono text-xs p-4 rounded overflow-auto max-h-64"
        ref={logsRef}
      >
        <div className="font-bold text-white mb-2">🛠 Debug Console</div>
        <ul className="space-y-1">
          {debugLogs.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RequestPage;