// src/pages/request.tsx

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const RequestPage = () => {
  // URL + ingestion options
  const [url, setUrl] = useState("");
  const [chapterPattern, setChapterPattern] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [genres, setGenres] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const logsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Append a timestamped message to the debug console
  const log = (msg: string) => {
    const timestamp = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setDebugLogs((prev) => {
      const next = [...prev, timestamp];
      return next.slice(-100);
    });
    requestAnimationFrame(() => {
      if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }
    });
  };

  // Submit ingestion request to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    log("🔄 Submitting ingestion request…");

    // Basic URL validation
    if (!url.match(/^https?:\/\//)) {
      log("❌ Invalid URL");
      toast.error("Please enter a full URL (starting with http:// or https://).");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        url,
        chapterPattern: chapterPattern || undefined,
        imageUrl: imageUrl || undefined,
        genres: genres
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        description: description || undefined,
      };
      log(`📋 Payload: ${JSON.stringify(payload)}`);

      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.novel_id) {
        log(`✅ Ingestion complete: novel_id=${data.novel_id}`);
        navigate(`/read/${data.novel_id}`);
      } else {
        const errMsg = data.message || res.statusText;
        log(`❌ Ingestion failed: ${errMsg}`);
        toast.error(`Ingestion failed: ${errMsg}`);
      }
    } catch (err: any) {
      log(`🚨 Request error: ${err.message}`);
      toast.error(`Request error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">📘 Admin Ingestion Cockpit</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Book URL (e.g. https://ixdzs.tw/read/582614/p1.html)"
          className="w-full px-4 py-2 border rounded"
          required
        />

        <input
          type="text"
          value={chapterPattern}
          onChange={(e) => setChapterPattern(e.target.value)}
          placeholder="Chapter URL pattern (e.g. p1.html, ch1)"
          className="w-full px-4 py-2 border rounded"
        />

        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Book Image URL"
          className="w-full px-4 py-2 border rounded"
        />

        <input
          type="text"
          value={genres}
          onChange={(e) => setGenres(e.target.value)}
          placeholder="Genres (comma-separated)"
          className="w-full px-4 py-2 border rounded"
        />

        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma-separated)"
          className="w-full px-4 py-2 border rounded"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (auto or manual override)"
          className="w-full px-4 py-2 border rounded"
          rows={4}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Submitting…" : "Start Ingestion"}
        </button>
      </form>

      {/* Console Toggle */}
      <button
        onClick={() => setConsoleOpen((o) => !o)}
        className="fixed bottom-4 right-4 bg-black text-white px-3 py-2 rounded-full shadow-lg z-50"
      >
        {consoleOpen ? "Close Console" : "Open Console"}
      </button>

      {/* Debug Console */}
      {consoleOpen && (
        <div
          ref={logsRef}
          className="fixed bottom-0 left-0 right-0 h-1/2 bg-black text-green-400 font-mono text-xs overflow-auto border-t border-gray-700 z-40"
        >
          <div className="sticky top-0 bg-black text-white font-bold p-2 flex justify-between items-center">
            <span>🔧 Debug Console</span>
            <button
              onClick={() => setDebugLogs([])}
              className="text-xs bg-red-600 px-2 py-1 rounded"
            >
              Clear
            </button>
          </div>
          <ul className="space-y-1 px-2">
            {debugLogs.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RequestPage;