// Mock extractor for ixdzs - returns proper structure
export async function extractBook(url: string) {
  // Mock implementation - would be replaced with actual scraping
  return {
    title: "Sample Book",
    toc: [
      { title: "Chapter 1", content: "Sample content 1" },
      { title: "Chapter 2", content: "Sample content 2" },
    ]
  };
}