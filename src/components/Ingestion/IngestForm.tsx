// frontend/components/IngestForm.tsx

import { useState } from "react";
import axios from "axios";

export default function IngestForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/api/ingest/", { url });
      setResult(res.data);
    } catch (err) {
      console.error("Ingestion failed:", err);
      setResult({ error: "Failed to ingest novel." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4">Ingest Novel</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Enter novel URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border px-4 py-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Ingesting..." : "Start Ingestion"}
        </button>
      </form>
      {result && (
        <div className="mt-4 text-sm text-gray-700">
          {result.error ? (
            <p className="text-red-600">{result.error}</p>
          ) : (
            <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(result.data, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
