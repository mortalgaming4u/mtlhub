// src/pages/request.tsx

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

  // Helper to validate only ixdzs.tw book URLs
  const isValidIxdzsUrl = (url: string) =>
    /^https?:\/\/(www\.)?ixdzs\.tw\/book\/\d+\/?$/.test(url);

  // Append timestamped debug entry
  const log = (msg: string) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setDebugLogs((prev) => {
      const updated = [...prev, entry];
      return updated.slice(-100);
    });
    requestAnimationFrame(() => {
      if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }
    });
  };

  // Fetch latest 10 requests from Supabase for display
  const fetchLogs = async () => {
    log("Fetching recent requests...");
    const { data, error } = await supabase
      .from("requests")
      .select("url, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      log("Error fetching logs: " + error.message);
    } else {
      setLogs(data as RequestLog[]);
      log(`Fetched ${data?.length ?? 0} recent requests.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    log("Form submitted");

    if (!isValidIxdzsUrl(url.trim())) {
      log("Invalid URL format");
      toast.error("Please enter a valid ixdzs.tw book URL.");
      return;
    }

    setLoading(true);
    log("Sending to ingestion API...");

    try {
      const resp = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const body = await resp.json();
      setLoading(false);

      if (!resp.ok || !body.novel_id) {
        const msg = body.error || "Unknown error";
        log("Ingestion API error: " + msg);
        toast.error("Failed to ingest: " + msg);
        return;
      }

      log("Ingestion successful, novel_id=" + body.novel_id);
      setUrl("");
      fetchLogs();
      navigate(`/read/${body.novel_id}`);
    } catch (err: any) {
      setLoading(false);
      log("Network error: " + err.message);
      toast.error("Network error: " + err.message);
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
          placeholder="Paste ixdzs.tw URL here"
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
          <p className="text-sm text-muted-foreground">
            Processing request...
          </p>
        )}
      </form>

      {/* Recent Requests */}
      <div className="mt-8 w-full max-w-md p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">📜 Recent Requests</h2>
        <ul className="text-sm space-y-1">
          {logs.map((logItem, i) => (
            <li key={i}>
              <span className="font-mono">{logItem.url}</span>{" "}
              <span className="text-gray-500">
                {new Date(logItem.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Toggle Debug Console */}
      <button
        onClick={() => setConsoleOpen(!consoleOpen)}
        className="fixed bottom-4 right-4 bg-black text-white px-3 py-2 rounded-full shadow-lg z-50"
      >
        {consoleOpen ? "Close Console" : "Open Console"}
      </button>

      {/* Debug Console */}
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
            {debugLogs.map((entry, i) => (
              <li key={i}>{entry}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RequestPage;