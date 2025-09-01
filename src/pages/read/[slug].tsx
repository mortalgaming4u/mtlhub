import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // ✅ Correct for Vite + React
import { getBookmark, setBookmark } from "@/lib/bookmark";

const ReadPage = () => {
  const { slug } = useParams(); // ✅ Get slug from URL
  const [chapters, setChapters] = useState<string[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    const fetchChapters = async () => {
      try {
        const res = await fetch(`/api/extract?slug=${slug}`);
        if (!res.ok) throw new Error("Failed to fetch chapters");

        const data = await res.json();
        setChapters(data.chapters || []);

        const savedIndex = getBookmark(slug);
        setSelectedChapter(
          savedIndex !== null && !isNaN(savedIndex) ? savedIndex : 0
        );
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Unable to load chapters. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [slug]);

  const handleSelectChapter = (index: number) => {
    setSelectedChapter(index);
    if (slug) {
      setBookmark(slug, index);
    }
  };

  if (loading) {
    return <p className="p-6 text-muted-foreground">Loading chapters...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-500">{error}</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">📖 Reading: Book {slug}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ul className="border rounded p-4 space-y-2 overflow-y-auto max-h-[80vh]">
          {chapters.map((_, index) => (
            <li
              key={index}
              onClick={() => handleSelectChapter(index)}
              className={`cursor-pointer ${
                index === selectedChapter ? "font-bold text-blue-600" : ""
              }`}
            >
              Chapter {index + 1}
            </li>
          ))}
        </ul>
        <div className="md:col-span-2 border rounded p-4 overflow-y-auto max-h-[80vh]">
          {selectedChapter !== null ? (
            <>
              <h2 className="text-xl font-semibold mb-2">
                Chapter {selectedChapter + 1}
              </h2>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {chapters[selectedChapter]}
              </p>
            </>
          ) : (
            <p>Select a chapter to begin reading.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadPage;
