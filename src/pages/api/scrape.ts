import { scrapeBook } from '@/lib/extractors/Index';
import { supabase } from '@/integrations/supabase/client';

interface ExtractionResult {
  title: string;
  author?: string;
  chapters: {
    title: string;
    content: string;
  }[];
}

export default async function handler(req, res) {
  const { data: requests, error } = await supabase
    .from('requests')
    .select('*')
    .eq('status', 'pending');

  if (error) return res.status(500).json({ error: error.message });

  for (const request of requests) {
    try {
      const book: ExtractionResult = await scrapeBook(request.url);

      const { data: novel, error: novelError } = await supabase
        .from('novels')
        .insert({
          title: book.title,
          author: book.author || 'Unknown Author',
          original_url: request.url,
          source_domain: 'twkan.com'
        })
        .select()
        .single();

      if (novelError) throw new Error(novelError.message);

      const chapters = book.chapters.map((chap: any, i: number) => ({
        novel_id: novel.id,
        chapter_number: i + 1,
        title: chap.title,
        content: chap.content,
      }));

      const { error: chapterError } = await supabase
        .from('chapters')
        .insert(chapters);

      if (chapterError) throw new Error(chapterError.message);

      await supabase
        .from('requests')
        .update({ status: 'completed', title: book.title })
        .eq('id', request.id);
    } catch (err) {
      await supabase
        .from('requests')
        .update({ status: 'rejected', notes: err.message })
        .eq('id', request.id);
    }
  }

  res.status(200).json({ message: 'Scraping complete' });
}
