import { extractTwkan } from './twkan';
import { extractPiaotia } from './piaotia';

export async function scrapeBook(url: string) {
  const domain = new URL(url).hostname;

  if (domain.includes('twkan.com')) {
    const result = await extractTwkan(url);
    return {
      title: result.book.title,
      author: result.book.author,
      chapters: result.chapters.map(ch => ({
        title: ch.title,
        content: ch.content || ''
      }))
    };
  }
  
  if (domain.includes('piaotia.com')) return await extractPiaotia(url);

  throw new Error(`Unsupported domain: ${domain}`);
}
