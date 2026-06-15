import DOMPurify from "dompurify";

/**
 * Sanitize any string that will be rendered as HTML or displayed to user.
 * Strips all HTML tags — returns plain text only.
 */
export function sanitize(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Sanitize and keep only safe inline HTML (bold, em, code, span, br).
 * Used for rendering stack traces / formatted messages.
 */
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "strong", "em", "i", "code", "pre", "span", "br"],
    ALLOWED_ATTR: ["class"],
  });
}
