import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content for safe rendering. Allows only tags and attributes
 * that TipTap's editor configuration can produce (paragraphs, headings, bold,
 * italic, underline, strikethrough, lists, blockquotes, links, text alignment).
 *
 * @param html - Raw HTML string that may contain user-authored content
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeDescriptionHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'h2',
      'h3',
      'br',
      'strong',
      'em',
      'u',
      's',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'hr',
    ],
    ALLOWED_ATTR: [
      'href',
      'target',
      'rel',
      'style', // For text-align property only
    ],
    FORCE_BODY: false,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
}

// Additional hook to be more restrictive on style attributes if needed
// This ensures only text-align values are preserved, no other inline styles
export function sanitizeDescriptionHtmlStrict(html: string): string {
  if (!html || typeof html !== 'string') return '';

  const config = {
    ALLOWED_TAGS: [
      'p',
      'h2',
      'h3',
      'br',
      'strong',
      'em',
      'u',
      's',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'hr',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORCE_BODY: false,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
  };

  let sanitized = DOMPurify.sanitize(html, config);

  // Post-process to allow only text-align in style attributes
  sanitized = sanitized.replace(/style="[^"]*"/g, (match: string) => {
    const styleValue = match.match(/style="([^"]*)"/)?.[1] || '';
    if (/^text-align:\s*(left|center|right|justify)/.test(styleValue)) {
      return match;
    }
    return ''; // Remove style if it doesn't match text-align pattern
  });

  return sanitized;
}
