export interface ExtractionResult {
  title: string;
  author?: string;
  chapters: {
    title: string;
    content: string;
  }[];
}

export interface Chapter {
  title: string;
  url: string;
  content?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  slug: string;
}