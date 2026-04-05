import DOMPurify from 'dompurify';

export const sanitizeHTML = (html) => {
  return DOMPurify.sanitize(html, { 
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'li', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: [] 
  });
};
