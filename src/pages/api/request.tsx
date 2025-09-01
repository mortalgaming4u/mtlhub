import { useState } from "react";
import { useRouter } from "next/router";

export default function RequestPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      const data = await res.json();

      if (res.ok && data.success && data.slug) {
        router.push(`/read/${encodeURIComponent(data.slug)}`);
      } else {
        alert(data.error || "Failed to ingest book.");
      }
    } catch (err) {
      console.error("Request error:", err);
      alert("Error processing request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Submit Book URL</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter book URL (e.g. https://twkan.com/book/76943.html)"
          className="w-full px-3 py-2 border rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? "Processing..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
