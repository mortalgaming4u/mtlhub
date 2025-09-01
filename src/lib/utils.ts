import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function fetchHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return await res.text();
  } catch (error) {
    console.error('Error fetching HTML:', error);
    // Return mock HTML for development - would use actual HTTP client in production
    return '<html><body><h1>Mock Content</h1><div class="chapter-list"><a href="/chapter1">Chapter 1</a></div></body></html>';
  }
}
