// src/utils/bookmark.ts
export const getBookmark = (slug: string): number | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`bookmark:${slug}`);
  return raw ? parseInt(raw, 10) : null;
};

export const setBookmark = (slug: string, chapterIndex: number) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(`bookmark:${slug}`, chapterIndex.toString());
};
