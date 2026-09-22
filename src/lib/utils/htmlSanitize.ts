import sanitizeHtml, { type Transformer } from 'sanitize-html';

const CMS_ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'em', 'b', 'i', 'u', 's', 'mark', 'small', 'sub', 'sup',
  'a',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'img',
  'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'div', 'span',
];

const CMS_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan', 'scope'],
  code: ['class'],
  pre: ['class'],
};

const CMS_ALLOWED_STYLES: { [index: string]: { [index: string]: RegExp[] } } = {};

const CMS_TRANSFORM_TAGS: Record<string, Transformer> = {
  a: (tagName, attribs) => {
    if (attribs.target === '_blank') {
      return {
        tagName,
        attribs: {
          ...attribs,
          rel: 'noopener noreferrer',
        },
      };
    }
    return { tagName, attribs };
  },
};

export function sanitizeCmsHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: CMS_ALLOWED_TAGS,
    allowedAttributes: CMS_ALLOWED_ATTRIBUTES,
    allowedStyles: CMS_ALLOWED_STYLES,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https'],
    },
    disallowedTagsMode: 'discard',
    transformTags: CMS_TRANSFORM_TAGS,
    parser: {
      lowerCaseAttributeNames: true,
    },
  });
}
