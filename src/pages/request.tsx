import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RequestLog {
  url: string;
  created_at: string;
}

const RequestPage = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [consoleOpen, setConsoleOpen] = useState(false);

  const log = (msg: string) => {
    const timestamp = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setDebugLogs((prev) => {
      const updated = [...prev, timestamp];
      return updated.slice(-100);
    });

    requestAnimationFrame(() => {
      if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }
    });
  };

  const extractSlugFromUrl = (url: string): string => {
    const match = url.match(/book\/(\d+)/);
    return match ? match[1] : "unknown";
  };

  const fetchLogs = async () => {
    log("Fetching recent requests from Supabase...");
    const { data, error } = await supabase
      .from("requests")
      .select("url, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setLogs(data as RequestLog[]);
      log("Fetched " + data.length + " recent requests.");
    } else {
      log("Error fetching logs: " + (error?.message || "unknown"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    log("Form submitted");

    if (!url.match(/^https?:\/\/(www\.)?twkan\.com\/book\/\d+(\.html)?/)) {
      log("Invalid URL format");
      toast.error("Please enter a valid twkan.com book URL.");
      return;
    }

    setLoading(true);
    log("Sending to Supabase...");

    const { error } = await supabase.from("requests").insert([{ url, user_id: null }]);

    setLoading(false);

    if (error) {
      log("Supabase error: " + error.message);
      toast.error("Failed to submit request: " + error.message);
    } else {
      log("Request submitted successfully");
      setUrl("");
      fetchLogs();

      const slug = extractSlugFromUrl(url);
      log("Extracted slug: " + slug);
      navigate(`/read/${slug}`);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">📚 Novel Request Form</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste twkan.com URL here"
          className="w-full px-4 py-2 border rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
        {loading && (
          <p className="text-sm text-muted-foreground">Processing request...</p>
        )}
      </form>

      {/* Logs Box */}
      <div className="mt-8 w-full max-w-md p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">📜 Recent Requests</h2>
        <ul className="text-sm space-y-1">
          {logs.map((log, i) => (
            <li key={i}>
              <span className="font-mono">{log.url}</span> —{" "}
              <span className="text-gray-500">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Floating toggle button */}
      <button
        onClick={() => setConsoleOpen(!consoleOpen)}
        className="fixed bottom-4 right-4 bg-black text-white px-3 py-2 rounded-full shadow-lg z-50"
      >
        {consoleOpen ? "Close Console" : "Open Console"}
      </button>

      {/* Static Debug Console */}
      {consoleOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 h-1/2 bg-black text-green-400 font-mono text-xs overflow-auto border-t border-gray-700 z-40"
          ref={logsRef}
        >
          <div className="sticky top-0 bg-black text-white font-bold p-2 flex justify-between items-center">
            <span>🛠 Debug Console</span>
            <button
              onClick={() => setDebugLogs([])}
              className="text-xs bg-red-600 px-2 py-1 rounded"
            >
              Clear
            </button>
          </div>
          <ul className="space-y-1 px-2">
            {debugLogs.map((log, i) => (
              <li key={i}>{log}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RequestPage;
