export function validateNarrative(content: string): string[] {
  const issues: string[] = [];

  if (content.length < 100) issues.push('Content too short');
  if (/[\u4e00-\u9fff]/.test(content)) issues.push('Untranslated Chinese detected');
  if (content.includes('??')) issues.push('Suspicious punctuation');
  if (content.includes('[Error') || content.includes('[No content')) issues.push('Fetch failure');

  return issues;
}
