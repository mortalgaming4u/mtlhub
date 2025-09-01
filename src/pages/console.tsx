import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const ConsolePage = () => {
  const [logs, setLogs] = useState<string[]>([]);
  interface RequestEntry {
    url: string;
    created_at: string;
  }
  const logsRef = useRef<HTMLDivElement>(null);

  const log = (msg: string) => {
    const timestamp = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setLogs((prev) => [...prev, timestamp].slice(-500));

    requestAnimationFrame(() => {
      if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }
    });
  };

  const fetchRecentRequests = async () => {
    log("🔍 Fetching recent requests from Supabase...");
    const { data, error } = await supabase
      .from("requests")
      .select("url, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      log("❌ Error: " + error.message);
    } else {
      (data as RequestEntry[])?.forEach((entry) => {
        log(`📚 ${entry.url} — ${new Date(entry.created_at).toLocaleString()}`);
      });
      log(`✅ Fetched ${data?.length || 0} entries.`);
    }
  };

  useEffect(() => {
    fetchRecentRequests();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🛠 Site Console</h1>
      <div
        className="border rounded bg-black text-green-400 font-mono text-xs overflow-auto h-[70vh] p-4"
        ref={logsRef}
      >
        <ul className="space-y-1">
          {logs.map((log, i) => (
            <li key={i}>{log}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ConsolePage;
