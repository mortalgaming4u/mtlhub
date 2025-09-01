// src/pages/ads-novel.tsx

export default function AdsNovelPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Import Novel from URL</h1>
      <form className="space-y-4">
        <input type="text" placeholder="Paste novel URL" className="input" />
        <select className="input">
          <option value="wtrlab">WTR-LAB</option>
          <option value="mtlnovel">MTLNovel</option>
        </select>
        <button type="submit" className="btn btn-primary">Grab & Import</button>
      </form>
    </div>
  );
}
