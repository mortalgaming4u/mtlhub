import * as cheerio from 'cheerio';
import { fetchHtml } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

type Chapter = {
  title: string;
  url: string;
  content?: string;
};

type Book = {
  id: string;
  title: string;
  author: string;
  slug: string;
};

type ExtractionResult = {
  book: Book;
  chapters: Chapter[];
  stats: {
    totalChapters: number;
    successfulChapters: number;
    failedChapters: number;
  };
};

// 🔍 Parse book metadata from HTML
function parseBookMetadata(html: string, bookUrl: string): Book {
  const $ = cheerio.load(html);
  
  const title = $('h1').first().text().trim() || 'Untitled';
  
  // Try multiple selectors for author
  const authorSelectors = [
    'span:contains("作者")',
    '.author',
    '[class*="author"]',
    'span:contains("Author")'
  ];
  
  let author = 'Unknown';
  for (const selector of authorSelectors) {
    const authorElement = $(selector).next().text().trim();
    if (authorElement) {
      author = authorElement;
      break;
    }
  }
  
  const bookIdMatch = bookUrl.match(/book\/(\d+)\.html/);
  const id = bookIdMatch ? bookIdMatch[1] : Date.now().toString();
  const slug = `twkan-${id}`;
  
  return { id, title, author, slug };
}

// 📚 Extract chapter list from HTML with multiple selector fallbacks
function parseChapterList(html: string): Chapter[] {
  const $ = cheerio.load(html);
  const chapters: Chapter[] = [];
  
  // Try multiple selectors to find chapters
  const chapterSelectors = [
    'div.chapter-list a',
    'ul.chapter-list li a',
    '.chapter-list a',
    'ul li a[href*="chapter"]',
    'a[href*="chapter"]'
  ];
  
  for (const selector of chapterSelectors) {
    $(selector).each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      
      if (href && text && !chapters.some(ch => ch.url === href)) {
        chapters.push({
          title: text,
          url: href.startsWith('http') ? href : `https://twkan.com${href}`,
        });
      }
    });
    
    // If we found chapters with this selector, break
    if (chapters.length > 0) break;
  }
  
  return chapters;
}

// 📖 Fetch and parse chapter content with better error handling
async function fetchChapterContent(chapter: Chapter): Promise<string> {
  try {
    const html = await fetchHtml(chapter.url);
    const $ = cheerio.load(html);
    
    // Try multiple content selectors
    const contentSelectors = [
      '.chapter-content',
      '#chapter-content',
      '.content',
      'div[class*="content"]',
      'div[id*="content"]'
    ];
    
    for (const selector of contentSelectors) {
      const content = $(selector).text().trim();
      if (content && content.length > 50) { // Ensure substantial content
        return content;
      }
    }
    
    return '[No content found]';
  } catch (err) {
    console.warn(`Error fetching ${chapter.url}:`, err);
    return '[Error fetching content]';
  }
}

// 🧾 Insert book and chapters into Supabase with error handling
async function ingestToSupabase(book: Book, chapters: Chapter[], bookUrl: string) {
  try {
    const { error: bookError } = await supabase
      .from('novels')
      .upsert({
        title: book.title,
        author: book.author,
        original_url: bookUrl,
        source_domain: 'twkan.com'
      });
    
    if (bookError) {
      console.error('Error inserting book:', bookError);
      throw bookError;
    }
    
    const { data: novelData } = await supabase
      .from('novels')
      .select('id')
      .eq('title', book.title)
      .single();

    if (!novelData) {
      throw new Error('Failed to create novel record');
    }

    const chaptersData = chapters.map((chap, index) => ({
      novel_id: novelData.id,
      chapter_number: index + 1,
      title: chap.title,
      content: chap.content,
    }));

    const { error: chaptersError } = await supabase
      .from('chapters')
      .upsert(chaptersData);
    
    if (chaptersError) {
      console.error('Error inserting chapters:', chaptersError);
      throw chaptersError;
    }
    
    console.log(`✅ Successfully stored ${book.title} with ${chapters.length} chapters`);
  } catch (error) {
    console.error('Database insertion failed:', error);
    throw error;
  }
}

// 🚀 Main extractor function with comprehensive error handling
export async function extractTwkan(bookUrl: string): Promise<ExtractionResult> {
  try {
    console.log(`🔍 Starting extraction for: ${bookUrl}`);
    
    const html = await fetchHtml(bookUrl);
    const book = parseBookMetadata(html, bookUrl);
    const chapters = parseChapterList(html);
    
    if (chapters.length === 0) {
      throw new Error('No chapters found. The page structure might have changed.');
    }
    
    console.log(`📚 Found ${chapters.length} chapters for "${book.title}" by ${book.author}`);
    
    let successfulChapters = 0;
    let failedChapters = 0;
    
    // Fetch chapter content with progress tracking
    for (let i = 0; i < chapters.length; i++) {
      const chap = chapters[i];
      console.log(`📖 Fetching chapter ${i + 1}/${chapters.length}: ${chap.title}`);
      
      chap.content = await fetchChapterContent(chap);
      
      if (chap.content.startsWith('[Error') || chap.content === '[No content found]') {
        failedChapters++;
      } else {
        successfulChapters++;
      }
      
      // Optional: Add delay to avoid rate limiting
      if (i < chapters.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Store in database
    await ingestToSupabase(book, chapters, bookUrl);
    
    const stats = {
      totalChapters: chapters.length,
      successfulChapters,
      failedChapters
    };
    
    console.log(`✅ Extraction complete! ${successfulChapters}/${chapters.length} chapters successful`);
    
    return { book, chapters, stats };
    
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    throw error;
  }
}

// 🎯 Utility function to extract without database storage
export async function extractTwkanMemoryOnly(bookUrl: string): Promise<Omit<ExtractionResult, 'stats'>> {
  const html = await fetchHtml(bookUrl);
  const book = parseBookMetadata(html, bookUrl);
  const chapters = parseChapterList(html);
  
  for (const chap of chapters) {
    chap.content = await fetchChapterContent(chap);
  }
  
  return { book, chapters };
}
